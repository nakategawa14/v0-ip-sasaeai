"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"

export async function sendMessage(matchId: string, content: string) {
  console.log("[v0 sendMessage] Starting with matchId:", matchId)

  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("[v0 sendMessage] No authenticated user")
    throw new Error("認証が必要です")
  }

  console.log("[v0 sendMessage] User ID:", user.id)

  if (!content.trim()) {
    throw new Error("メッセージを入力してください")
  }

  const { data: profile, error: profileError } = await supabase
    .from(TABLES.PROFILES)
    .select("id, gender, membership_status")
    .eq("id", user.id)
    .single()

  console.log("[v0 sendMessage] Profile query result:", { profile, profileError })

  if (profileError) {
    console.error("[v0 sendMessage] Profile query error:", profileError)
    throw new Error("プロフィールの取得に失敗しました")
  }

  if (!profile) {
    throw new Error("プロフィールが見つかりません")
  }

  const enablePaidMessaging = process.env.NEXT_PUBLIC_ENABLE_PAID_MESSAGING === "true"

  if (enablePaidMessaging) {
    // 有料会員制限が有効な場合、無料会員の男性はメッセージ送信不可
    const isPaidMember = profile.membership_status === "paid"
    const isFreeMale = profile.gender === "male" && !isPaidMember

    if (isFreeMale) {
      console.log("[v0 sendMessage] Free male user attempted to send message")
      throw new Error("PREMIUM_REQUIRED")
    }

    console.log("[v0 sendMessage] Paid messaging enabled - user is authorized")
  } else {
    console.log("[v0 sendMessage] Paid messaging disabled - all users can send messages")
  }

  // 無料プランの男性もメッセージ送信可能にする（テスト用）
  console.log("[v0 sendMessage] Profile gender:", profile.gender)

  // マッチングが存在するか確認
  console.log("[v0 sendMessage] Checking match existence...")
  const { data: match, error: matchError } = await supabase
    .from(TABLES.MATCHES)
    .select("id, user1_id, user2_id")
    .eq("id", matchId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single()

  console.log("[v0 sendMessage] Match query result:", { match, matchError })

  if (matchError) {
    console.error("[v0] sendMessage error:", matchError)
    throw new Error("マッチングの確認に失敗しました")
  }

  if (!match) {
    throw new Error("マッチングが見つかりません")
  }

  // メッセージを送信
  console.log("[v0 sendMessage] Attempting to insert message...")
  const { data: messageData, error: messageError } = await supabase
    .from(TABLES.MESSAGES)
    .insert({
      match_id: matchId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select()

  console.log("[v0 sendMessage] Message insert result:", { messageData, messageError })

  if (messageError) {
    console.error("[v0] sendMessage error:", messageError)
    throw new Error(`メッセージの送信に失敗しました: ${messageError.message}`)
  }

  console.log("[v0 sendMessage] Message sent successfully!")

  const recipientId = match.user1_id === user.id ? match.user2_id : match.user1_id
  await createNotification(
    recipientId,
    "message",
    "新しいメッセージ",
    "新しいメッセージが届きました",
    `/messages/${matchId}`,
    user.id,
  )

  revalidatePath(`/messages/${matchId}`)

  console.log("[v0 sendMessage] Completed successfully")
}

export async function markAsRead(messageIds: string[]) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("[v0 markAsRead] No authenticated user")
    throw new Error("認証が必要です")
  }

  const { error } = await supabase
    .from(TABLES.MESSAGES)
    .update({ is_read: true })
    .in("id", messageIds)
    .neq("sender_id", user.id)

  if (error) {
    console.error("[v0] markAsRead error:", error)
    throw new Error("既読処理に失敗しました")
  }
}
