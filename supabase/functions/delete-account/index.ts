import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2"

type DbLikeClient = ReturnType<typeof createClient>

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

async function deleteForUser(admin: DbLikeClient, userId: string) {
  const { data: matches, error: matchErr } = await admin
    .from("sasaeai_matches")
    .select("id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
  if (matchErr) throw new Error(`matches lookup failed: ${matchErr.message}`)

  const matchIds = (matches ?? []).map((m) => String((m as { id: string }).id))
  if (matchIds.length > 0) {
    const { data: rooms, error: roomErr } = await admin
      .from("sasaeai_chat_rooms")
      .select("id")
      .in("match_id", matchIds)
    if (roomErr) throw new Error(`chat rooms lookup failed: ${roomErr.message}`)

    const roomIds = (rooms ?? []).map((r) => String((r as { id: string }).id))
    if (roomIds.length > 0) {
      const { error: msgByRoomErr } = await admin.from("sasaeai_chat_messages").delete().in("chat_room_id", roomIds)
      if (msgByRoomErr) throw new Error(`chat messages by room delete failed: ${msgByRoomErr.message}`)

      const { error: roomDelErr } = await admin.from("sasaeai_chat_rooms").delete().in("id", roomIds)
      if (roomDelErr) throw new Error(`chat rooms delete failed: ${roomDelErr.message}`)
    }

    const { error: matchDelErr } = await admin.from("sasaeai_matches").delete().in("id", matchIds)
    if (matchDelErr) throw new Error(`matches delete failed: ${matchDelErr.message}`)
  }

  const { error: msgBySenderErr } = await admin.from("sasaeai_chat_messages").delete().eq("sender_id", userId)
  if (msgBySenderErr) throw new Error(`chat messages by sender delete failed: ${msgBySenderErr.message}`)

  const { error: likeErr } = await admin.from("sasaeai_likes").delete().or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
  if (likeErr) throw new Error(`likes delete failed: ${likeErr.message}`)

  const { error: blockErr } = await admin
    .from("sasaeai_blocks")
    .delete()
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
  if (blockErr) throw new Error(`blocks delete failed: ${blockErr.message}`)

  const { error: reportErr } = await admin
    .from("sasaeai_reports")
    .delete()
    .or(`reporter_id.eq.${userId},reported_id.eq.${userId}`)
  if (reportErr) throw new Error(`reports delete failed: ${reportErr.message}`)

  await admin.from("sasaeai_system_notifications").delete().or(`actor_user_id.eq.${userId},subject_user_id.eq.${userId}`)

  const { error: profileErr } = await admin.from("sasaeai_profiles").delete().eq("id", userId)
  if (profileErr) throw new Error(`profiles delete failed: ${profileErr.message}`)
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: "missing_supabase_env" })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return json(401, { error: "missing_authorization_header" })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  })
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser()
  if (userErr || !user) {
    return json(401, { error: "invalid_user_session" })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  try {
    await deleteForUser(admin, user.id)
    const { error: authErr } = await admin.auth.admin.deleteUser(user.id)
    if (authErr) {
      return json(500, { error: `auth_user_delete_failed: ${authErr.message}` })
    }
    return json(200, { ok: true })
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : "unknown_delete_error" })
  }
})
