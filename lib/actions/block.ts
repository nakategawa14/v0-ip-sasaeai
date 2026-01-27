"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"

export async function blockUser(blockedId: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

  if (user.id === blockedId) {
    return { error: "自分自身をブロックすることはできません" }
  }

  // ブロック追加
  const { error } = await supabase.from(TABLES.BLOCKS).insert({
    blocker_id: user.id,
    blocked_id: blockedId,
  })

  if (error) {
    console.error("Error blocking user:", error)
    return { error: "ブロックに失敗しました" }
  }

  // 既存のいいねを削除
  await supabase.from(TABLES.LIKES).delete().eq("from_user_id", user.id).eq("to_user_id", blockedId)

  await supabase.from(TABLES.LIKES).delete().eq("from_user_id", blockedId).eq("to_user_id", user.id)

  // 既存のマッチングを削除（テーブルが存在する場合）
  try {
    await supabase
      .from(TABLES.MATCHES)
      .delete()
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .or(`user1_id.eq.${blockedId},user2_id.eq.${blockedId}`)
  } catch (err) {
    // テーブルが存在しない場合はスキップ
  }

  revalidatePath("/search")
  revalidatePath("/likes")
  revalidatePath("/matches")
  revalidatePath(`/profile/${blockedId}`)

  return { success: true }
}

export async function unblockUser(blockedId: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

  const { error } = await supabase.from(TABLES.BLOCKS).delete().eq("blocker_id", user.id).eq("blocked_id", blockedId)

  if (error) {
    console.error("Error unblocking user:", error)
    return { error: "ブロック解除に失敗しました" }
  }

  revalidatePath("/search")
  revalidatePath("/likes")
  revalidatePath("/admin/blocks")

  return { success: true }
}

export async function getBlockedUsers() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です", blockedUsers: [] }
  }

  const { data: blocks, error } = await supabase.from(TABLES.BLOCKS).select("blocked_id").eq("blocker_id", user.id)

  if (error) {
    console.error("Error fetching blocked users:", error)
    return { error: "ブロックリストの取得に失敗しました", blockedUsers: [] }
  }

  if (!blocks || blocks.length === 0) {
    return { success: true, blockedUsers: [] }
  }

  // ブロックされたユーザーのプロフィールを取得
  const blockedIds = blocks.map((b) => b.blocked_id)
  const { data: profiles, error: profileError } = await supabase.from(TABLES.PROFILES).select("*").in("id", blockedIds)

  if (profileError) {
    console.error("Error fetching blocked user profiles:", profileError)
    return { error: "ブロックリストの取得に失敗しました", blockedUsers: [] }
  }

  return { success: true, blockedUsers: profiles || [] }
}
