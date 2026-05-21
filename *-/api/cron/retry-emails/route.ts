import { NextResponse } from "next/server"
import { retryAllFailedEmails } from "@/lib/email/email-logger"

// Vercel Cronジョブ用エンドポイント
// vercel.jsonで設定: { "crons": [{ "path": "/api/cron/retry-emails", "schedule": "0 * * * *" }] }
export async function GET(request: Request) {
  // Cron認証（Vercel Cronからのリクエストか確認）
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // 開発環境ではスキップ
    if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const results = await retryAllFailedEmails()

    console.log(`[Cron] Email retry completed: ${results.success}/${results.total} successful`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    })
  } catch (error) {
    console.error("[Cron] Email retry error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Cron job failed" }, { status: 500 })
  }
}
