"use server"

import { createServerClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"

// 通知頻度の型定義
export type NotificationFrequency = "immediate" | "daily" | "three_times_daily"

// 管理者通知設定の型
export interface AdminNotificationSettings {
  id: string
  admin_id: string
  notification_frequency: NotificationFrequency
  notify_new_verification: boolean
  notify_new_report: boolean
  notify_new_user: boolean
  notify_email_failure: boolean
  email_notification_enabled: boolean
  last_summary_sent_at: string | null
}

// デフォルト設定
const DEFAULT_SETTINGS: Omit<AdminNotificationSettings, "id" | "admin_id" | "last_summary_sent_at"> = {
  notification_frequency: "immediate",
  notify_new_verification: true,
  notify_new_report: true,
  notify_new_user: true,
  notify_email_failure: true,
  email_notification_enabled: true,
}

// 管理者の通知設定を取得
export async function getAdminNotificationSettings(): Promise<AdminNotificationSettings | null> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // 管理者チェック
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) return null

  // 設定を取得
  const { data: settings } = await supabase
    .from("sasaeai_admin_notification_settings")
    .select("*")
    .eq("admin_id", user.id)
    .single()

  if (settings) {
    return settings as AdminNotificationSettings
  }

  // 設定がない場合はデフォルト設定を作成
  const { data: newSettings, error } = await supabase
    .from("sasaeai_admin_notification_settings")
    .insert({
      admin_id: user.id,
      ...DEFAULT_SETTINGS,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create admin notification settings:", error)
    return null
  }

  return newSettings as AdminNotificationSettings
}

// 管理者の通知設定を更新
export async function updateAdminNotificationSettings(
  settings: Partial<Omit<AdminNotificationSettings, "id" | "admin_id" | "last_summary_sent_at">>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "未ログイン" }

  // 管理者チェック
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) return { success: false, error: "権限がありません" }

  // 設定を更新または作成
  const { error } = await supabase.from("sasaeai_admin_notification_settings").upsert(
    {
      admin_id: user.id,
      ...settings,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "admin_id",
    },
  )

  if (error) {
    console.error("Failed to update admin notification settings:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// 管理者にイベント通知を送信（即時またはキューに追加）
export async function notifyAdmins(
  eventType: "new_verification" | "new_report" | "new_user" | "email_failure",
  eventData: Record<string, unknown>,
): Promise<void> {
  const supabase = await createServerClient()

  // 全管理者を取得
  const { data: admins } = await supabase.from(TABLES.PROFILES).select("id, email, nickname").eq("is_admin", true)

  if (!admins || admins.length === 0) return

  for (const admin of admins) {
    // 管理者の設定を取得
    const { data: settings } = await supabase
      .from("sasaeai_admin_notification_settings")
      .select("*")
      .eq("admin_id", admin.id)
      .single()

    // 設定がない場合はデフォルト（即時通知）
    const notificationSettings = settings || DEFAULT_SETTINGS

    // このイベントタイプの通知が有効かチェック
    const eventSettingKey = `notify_${eventType}` as keyof typeof notificationSettings
    if (notificationSettings[eventSettingKey] === false) continue

    if (notificationSettings.notification_frequency === "immediate") {
      // 即時通知：アプリ内通知を作成
      await createAdminNotification(admin.id, eventType, eventData)

      // メール通知が有効な場合はメールも送信
      if (notificationSettings.email_notification_enabled && admin.email) {
        await sendAdminEventEmail(admin.email, admin.nickname || "管理者", eventType, eventData)
      }
    } else {
      // サマリー通知：キューに追加
      await supabase.from("sasaeai_admin_notification_queue").insert({
        admin_id: admin.id,
        event_type: eventType,
        event_data: eventData,
      })
    }
  }
}

// アプリ内通知を作成
async function createAdminNotification(
  adminId: string,
  eventType: string,
  eventData: Record<string, unknown>,
): Promise<void> {
  const supabase = await createServerClient()

  const titles: Record<string, string> = {
    new_verification: "新規本人確認申請",
    new_report: "新規通報",
    new_user: "新規ユーザー登録",
    email_failure: "メール送信失敗",
  }

  const messages: Record<string, string> = {
    new_verification: `${eventData.nickname || "ユーザー"}さんが本人確認書類を提出しました`,
    new_report: `${eventData.reporter_nickname || "ユーザー"}さんが通報を行いました`,
    new_user: `${eventData.nickname || "ユーザー"}さんが新規登録しました`,
    email_failure: `${eventData.email || "不明"}へのメール送信が失敗しました`,
  }

  await supabase.from(TABLES.NOTIFICATIONS).insert({
    user_id: adminId,
    type: "admin_alert",
    title: titles[eventType] || "管理者通知",
    message: messages[eventType] || "新しいイベントがあります",
    data: { eventType, ...eventData },
  })
}

// 管理者にイベントメールを送信
async function sendAdminEventEmail(
  email: string,
  nickname: string,
  eventType: string,
  eventData: Record<string, unknown>,
): Promise<void> {
  const subjects: Record<string, string> = {
    new_verification: "【ささえ愛】新規本人確認申請",
    new_report: "【ささえ愛】新規通報",
    new_user: "【ささえ愛】新規ユーザー登録",
    email_failure: "【ささえ愛】メール送信失敗",
  }

  const bodies: Record<string, string> = {
    new_verification: `${eventData.nickname || "ユーザー"}さんが本人確認書類を提出しました。管理画面から確認してください。`,
    new_report: `${eventData.reporter_nickname || "ユーザー"}さんが通報を行いました。管理画面から確認してください。`,
    new_user: `${eventData.nickname || "ユーザー"}さんが新規登録しました。`,
    email_failure: `${eventData.email || "不明"}へのメール送信が失敗しました。管理画面から確認してください。`,
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://sasaeai.help"}/api/admin/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: subjects[eventType] || "【ささえ愛】管理者通知",
        html: `
          <p>${nickname}さん</p>
          <p>${bodies[eventType] || "新しいイベントがあります。"}</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sasaeai.help"}/admin">管理画面を開く</a></p>
        `,
      }),
    })

    if (!response.ok) {
      console.error("Failed to send admin event email")
    }
  } catch (error) {
    console.error("Error sending admin event email:", error)
  }
}

// サマリーメールの内容を取得
export async function getAdminSummary(adminId: string): Promise<{
  verifications: number
  reports: number
  newUsers: number
  emailFailures: number
  events: Array<{ event_type: string; event_data: Record<string, unknown>; created_at: string }>
}> {
  const supabase = await createServerClient()

  // キューからイベントを取得
  const { data: events } = await supabase
    .from("sasaeai_admin_notification_queue")
    .select("*")
    .eq("admin_id", adminId)
    .eq("processed", false)
    .order("created_at", { ascending: false })

  const summary = {
    verifications: 0,
    reports: 0,
    newUsers: 0,
    emailFailures: 0,
    events: events || [],
  }

  for (const event of events || []) {
    switch (event.event_type) {
      case "new_verification":
        summary.verifications++
        break
      case "new_report":
        summary.reports++
        break
      case "new_user":
        summary.newUsers++
        break
      case "email_failure":
        summary.emailFailures++
        break
    }
  }

  return summary
}

// キューのイベントを処理済みにする
export async function markQueueAsProcessed(adminId: string): Promise<void> {
  const supabase = await createServerClient()

  await supabase
    .from("sasaeai_admin_notification_queue")
    .update({ processed: true })
    .eq("admin_id", adminId)
    .eq("processed", false)
}
