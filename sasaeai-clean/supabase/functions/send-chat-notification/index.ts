import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2"

type WebhookBody = {
  type?: string
  table?: string
  schema?: string
  record?: Record<string, unknown> | null
  old_record?: Record<string, unknown> | null
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceRoleKey) return json(500, { error: "missing_supabase_env" })

  // DB Webhook から直接叩く前提。設定した場合のみシークレット照合。
  const expectedSecret = Deno.env.get("CHAT_WEBHOOK_SECRET")
  if (expectedSecret) {
    const got = req.headers.get("x-webhook-secret")
    if (!got || got !== expectedSecret) return json(401, { error: "invalid_webhook_secret" })
  }

  const payload = (await req.json().catch(() => null)) as WebhookBody | null
  const rec = payload?.record ?? null
  if (!rec) return json(200, { ok: true, skipped: "no_record" })

  const messageId = str(rec.id)
  const roomId = str(rec.chat_room_id)
  const senderId = str(rec.sender_id)
  const content = str(rec.content) ?? ""
  if (!messageId || !roomId || !senderId) {
    return json(200, { ok: true, skipped: "missing_message_fields" })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  // chat_room -> match -> 受信者（sender ではない側）を特定
  const { data: room, error: roomErr } = await admin
    .from("sasaeai_chat_rooms")
    .select("id, match_id")
    .eq("id", roomId)
    .maybeSingle()
  if (roomErr || !room?.match_id) return json(200, { ok: true, skipped: "room_not_found" })

  const { data: match, error: matchErr } = await admin
    .from("sasaeai_matches")
    .select("id, user1_id, user2_id, status, is_active")
    .eq("id", room.match_id)
    .maybeSingle()
  if (matchErr || !match?.user1_id || !match?.user2_id) {
    return json(200, { ok: true, skipped: "match_not_found" })
  }
  if (match.is_active === false || (match.status && match.status !== "matched")) {
    return json(200, { ok: true, skipped: "match_inactive" })
  }

  const recipientId = match.user1_id === senderId ? match.user2_id : match.user1_id
  if (!recipientId || recipientId === senderId) return json(200, { ok: true, skipped: "recipient_not_found" })

  // ブロック関係なら通知しない
  const { data: blockRow } = await admin
    .from("sasaeai_blocks")
    .select("blocker_id")
    .or(`and(blocker_id.eq.${senderId},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${senderId})`)
    .limit(1)
    .maybeSingle()
  if (blockRow) return json(200, { ok: true, skipped: "blocked_pair" })

  const [{ data: recipient }, { data: sender }] = await Promise.all([
    admin.from("sasaeai_profiles").select("id, expo_push_token").eq("id", recipientId).maybeSingle(),
    admin.from("sasaeai_profiles").select("id, nickname").eq("id", senderId).maybeSingle(),
  ])

  const expoPushToken = str(recipient?.expo_push_token)
  if (!expoPushToken || !expoPushToken.startsWith("ExponentPushToken[")) {
    return json(200, { ok: true, skipped: "recipient_no_push_token" })
  }

  const senderName = str(sender?.nickname) ?? "新着メッセージ"
  const bodyPreview = content.trim().slice(0, 120) || "メッセージが届きました"

  const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: "default",
      title: senderName,
      body: bodyPreview,
      data: {
        type: "chat_message",
        chat_room_id: roomId,
        sender_id: senderId,
        message_id: messageId,
      },
    }),
  })

  if (!expoRes.ok) {
    const txt = await expoRes.text().catch(() => "")
    return json(502, { error: "expo_push_send_failed", details: txt.slice(0, 500) })
  }

  const expoJson = (await expoRes.json().catch(() => null)) as Record<string, unknown> | null
  return json(200, { ok: true, expo: expoJson })
})
