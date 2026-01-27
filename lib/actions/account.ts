"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { TABLES } from "@/lib/supabase/table-names"

export async function toggleSecretMode() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

  // 現在のシークレットモード状態を取得
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_secret_mode").eq("id", user.id).single()

  if (!profile) {
    return { error: "プロフィールが見つかりません" }
  }

  // トグル
  const { error } = await supabase
    .from(TABLES.PROFILES)
    .update({ is_secret_mode: !profile.is_secret_mode })
    .eq("id", user.id)

  if (error) {
    return { error: "更新に失敗しました" }
  }

  revalidatePath("/settings")
  return { success: true, isSecretMode: !profile.is_secret_mode }
}

export async function deleteAccount() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

  // プロフィールを非アクティブにする（完全削除ではなく論理削除）
  const { error: profileError } = await supabase
    .from(TABLES.PROFILES)
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (profileError) {
    return { error: "アカウント削除に失敗しました" }
  }

  // Supabase Authからもログアウト
  await supabase.auth.signOut()

  redirect("/login")
}

export async function sendContactMessage(message: string, subject: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("email, nickname").eq("id", user.id).single()

  if (!profile) {
    return { error: "プロフィールが見つかりません" }
  }

  // contact_messagesテーブルに保存
  const { error } = await supabase.from("contact_messages").insert({
    user_id: user.id,
    email: profile.email,
    nickname: profile.nickname,
    subject: subject,
    message: message,
    status: "new",
  })

  if (error) {
    return { error: "メッセージの送信に失敗しました" }
  }

  return { success: true }
}
