"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { revalidatePath } from "next/cache"
import { sendPushNotification } from "./push-notifications"

export type NotificationType =
  | "profile_view"
  | "like_received"
  | "match"
  | "message"
  | "verification_request" // 新規本人確認申請（管理者向け）
  | "verification_approved" // 本人確認承認（ユーザー向け）
  | "verification_rejected" // 本人確認却下（ユーザー向け）
  | "system" // システム通知

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  related_user_id?: string
  is_read: boolean
  created_at: string
  related_profile?: {
    nickname?: string
    display_name?: string
    profile_image_url?: string
  }
}

// 通知を作成
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  relatedUserId?: string,
) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from(TABLES.NOTIFICATIONS).insert({
    user_id: userId,
    type,
    title,
    message,
    link,
    related_user_id: relatedUserId,
  })

  if (error) {
    console.error("通知作成エラー:", error)
    return { success: false, error: error.message }
  }

  // プッシュ通知を送信（バックグラウンドで実行、エラーは無視）
  sendPushNotification(userId, title, message, link).catch((err) => {
    console.error("プッシュ通知送信エラー:", err)
  })

  revalidatePath("/notifications")
  return { success: true }
}

export async function notifyAdmins(
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  relatedUserId?: string,
) {
  const supabase = await createServerSupabaseClient()

  const { data: admins, error: adminError } = await supabase.from(TABLES.PROFILES).select("id").eq("is_admin", true)

  if (adminError || !admins || admins.length === 0) {
    console.error("管理者取得エラー:", adminError)
    return { success: false, error: "管理者が見つかりません" }
  }

  const notifications = admins.map((admin) => ({
    user_id: admin.id,
    type,
    title,
    message,
    link,
    related_user_id: relatedUserId,
  }))

  const { error } = await supabase.from(TABLES.NOTIFICATIONS).insert(notifications)

  if (error) {
    console.error("管理者通知作成エラー:", error)
    return { success: false, error: error.message }
  }

  // 各管理者にプッシュ通知を送信
  for (const admin of admins) {
    sendPushNotification(admin.id, title, message, link).catch((err) => {
      console.error("管理者プッシュ通知送信エラー:", err)
    })
  }

  return { success: true }
}

export async function notifyAdminsNewVerificationRequest(userId: string, userNickname: string) {
  return notifyAdmins(
    "verification_request",
    "新規本人確認申請",
    `${userNickname}さんが本人確認書類をアップロードしました。確認をお願いします。`,
    "/admin/verification",
    userId,
  )
}

export async function notifyUserVerificationApproved(userId: string) {
  return createNotification(
    userId,
    "verification_approved",
    "本人確認が承認されました",
    "本人確認が完了しました。認証済みバッジがプロフィールに表示されます。",
    "/settings",
  )
}

export async function notifyUserVerificationRejected(userId: string, reason?: string) {
  const message = reason
    ? `本人確認が承認されませんでした。理由: ${reason}。再度申請する場合は、プロフィール設定から本人確認書類をアップロードしてください。`
    : "本人確認が承認されませんでした。再度申請する場合は、プロフィール設定から本人確認書類をアップロードしてください。"

  return createNotification(userId, "verification_rejected", "本人確認について", message, "/settings")
}

// ユーザーの通知一覧を取得
export async function getNotifications(limit = 50) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { notifications: [], unreadCount: 0 }
  }

  const { data: notifications, error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("通知取得エラー:", error)
    return { notifications: [], unreadCount: 0 }
  }

  const relatedUserIds = notifications?.filter((n) => n.related_user_id).map((n) => n.related_user_id) || []

  let profilesMap: Record<string, any> = {}
  if (relatedUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from(TABLES.PROFILES)
      .select("id, nickname, display_name, profile_image_url")
      .in("id", relatedUserIds)

    if (profiles) {
      profilesMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
    }
  }

  const notificationsWithProfiles =
    notifications?.map((n) => ({
      ...n,
      related_profile: n.related_user_id ? profilesMap[n.related_user_id] : undefined,
    })) || []

  const { count: unreadCount } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  return {
    notifications: notificationsWithProfiles as Notification[],
    unreadCount: unreadCount || 0,
  }
}

// 通知を既読にする
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from(TABLES.NOTIFICATIONS).update({ is_read: true }).eq("id", notificationId)

  if (error) {
    console.error("通知既読エラー:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/notifications")
  return { success: true }
}

export async function markAllNotificationsAsRead() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "認証されていません" }
  }

  const { error } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) {
    console.error("全通知既読エラー:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/notifications")
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from(TABLES.NOTIFICATIONS).delete().eq("id", notificationId)

  if (error) {
    console.error("通知削除エラー:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/notifications")
  return { success: true }
}

export async function getUnreadNotificationCount() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return 0
  }

  const { count } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  return count || 0
}

// マッチング通知を作成
export async function notifyMatch(user1Id: string, user2Id: string, user1Nickname: string, user2Nickname: string) {
  const supabase = await createServerSupabaseClient()

  const notifications = [
    {
      user_id: user1Id,
      type: "match" as NotificationType,
      title: "マッチングが成立しました！",
      message: `${user2Nickname}さんとマッチングしました。メッセージを送ってみましょう！`,
      link: "/matches",
      related_user_id: user2Id,
    },
    {
      user_id: user2Id,
      type: "match" as NotificationType,
      title: "マッチングが成立しました！",
      message: `${user1Nickname}さんとマッチングしました。メッセージを送ってみましょう！`,
      link: "/matches",
      related_user_id: user1Id,
    },
  ]

  const { error } = await supabase.from(TABLES.NOTIFICATIONS).insert(notifications)

  if (error) {
    console.error("マッチング通知作成エラー:", error)
    return { success: false, error: error.message }
  }

  // 両ユーザーにプッシュ通知を送信
  sendPushNotification(
    user1Id,
    "マッチングが成立しました！",
    `${user2Nickname}さんとマッチングしました。`,
    "/matches",
  ).catch(console.error)

  sendPushNotification(
    user2Id,
    "マッチングが成立しました！",
    `${user1Nickname}さんとマッチングしました。`,
    "/matches",
  ).catch(console.error)

  revalidatePath("/notifications")
  revalidatePath("/matches")
  return { success: true }
}
