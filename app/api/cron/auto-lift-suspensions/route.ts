import { NextResponse } from "next/server"
import { autoLiftExpiredSuspensions } from "@/lib/actions/suspensions"

// Cronジョブ：期限切れの停止を自動解除（1時間ごとに実行推奨）
export async function GET(request: Request) {
  // Vercel Cronからの呼び出しを確認
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // CRON_SECRETが設定されていない場合はスキップ
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const result = await autoLiftExpiredSuspensions()

  return NextResponse.json({
    success: true,
    message: `${result.lifted}件の停止を自動解除しました`,
  })
}
