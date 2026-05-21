import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { TABLES } from "@/lib/supabase/table-names"

// Cronジョブ: 管理者サマリー通知を送信
// 呼び出しスケジュール:
// - 日次: 毎日9時
// - 1日3回: 9時、12時、17時

export async function GET(request: Request) {
  // Cronジョブの認証（Vercel Cronの場合）
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // 開発環境では認証をスキップ
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // 現在時刻を取得（JST）
  const now = new Date()
  const jstHour = (now.getUTCHours() + 9) % 24

  // サービスロールでSupabaseに接続
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // 全管理者とその設定を取得
  const { data: admins } = await supabase.from(TABLES.PROFILES).select("id, email, nickname").eq("is_admin", true)

  if (!admins || admins.length === 0) {
    return NextResponse.json({ message: "No admins found", processed: 0 })
  }

  let processedCount = 0

  for (const admin of admins) {
    // 管理者の設定を取得
    const { data: settings } = await supabase
      .from("sasaeai_admin_notification_settings")
      .select("*")
      .eq("admin_id", admin.id)
      .single()

    if (!settings) continue

    // 通知頻度をチェック
    const shouldSend = checkShouldSendSummary(settings.notification_frequency, jstHour)
    if (!shouldSend) continue

    // メール通知が無効な場合はスキップ
    if (!settings.email_notification_enabled) continue

    // キューからイベントを取得
    const { data: events } = await supabase
      .from("sasaeai_admin_notification_queue")
      .select("*")
      .eq("admin_id", admin.id)
      .eq("processed", false)

    if (!events || events.length === 0) continue

    // サマリーを集計
    const summary = {
      verifications: 0,
      reports: 0,
      newUsers: 0,
      emailFailures: 0,
    }

    for (const event of events) {
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

    // サマリーメールを送信
    if (admin.email) {
      await sendSummaryEmail(admin.email, admin.nickname || "管理者", summary)
    }

    // キューを処理済みにする
    await supabase
      .from("sasaeai_admin_notification_queue")
      .update({ processed: true })
      .eq("admin_id", admin.id)
      .eq("processed", false)

    // 最終送信日時を更新
    await supabase
      .from("sasaeai_admin_notification_settings")
      .update({ last_summary_sent_at: new Date().toISOString() })
      .eq("admin_id", admin.id)

    processedCount++
  }

  return NextResponse.json({
    message: "Admin summary notifications processed",
    processed: processedCount,
    hour: jstHour,
  })
}

// 通知を送信すべきかチェック
function checkShouldSendSummary(frequency: string, jstHour: number): boolean {
  switch (frequency) {
    case "daily":
      // 毎日9時
      return jstHour === 9
    case "three_times_daily":
      // 9時、12時、17時
      return [9, 12, 17].includes(jstHour)
    default:
      // immediate は Cron では処理しない
      return false
  }
}

// サマリーメールを送信
async function sendSummaryEmail(
  email: string,
  nickname: string,
  summary: { verifications: number; reports: number; newUsers: number; emailFailures: number },
): Promise<void> {
  const totalEvents = summary.verifications + summary.reports + summary.newUsers + summary.emailFailures

  if (totalEvents === 0) return

  const items: string[] = []
  if (summary.verifications > 0) items.push(`本人確認申請: ${summary.verifications}件`)
  if (summary.reports > 0) items.push(`通報: ${summary.reports}件`)
  if (summary.newUsers > 0) items.push(`新規ユーザー: ${summary.newUsers}件`)
  if (summary.emailFailures > 0) items.push(`メール送信失敗: ${summary.emailFailures}件`)

  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://sasaeai.help"}/api/admin/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: `【ささえ愛】管理者サマリー（${totalEvents}件の通知）`,
        html: `
          <p>${nickname}さん</p>
          <p>以下の管理者通知があります：</p>
          <ul>
            ${items.map((item) => `<li>${item}</li>`).join("")}
          </ul>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sasaeai.help"}/admin">管理画面を開く</a></p>
        `,
      }),
    })
  } catch (error) {
    console.error("Error sending summary email:", error)
  }
}
