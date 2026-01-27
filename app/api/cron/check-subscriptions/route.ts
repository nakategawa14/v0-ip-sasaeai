import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { TABLES } from "@/lib/supabase/table-names"

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function GET(request: Request) {
  // Cron認証（Vercel Cronからの呼び出しを検証）
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date().toISOString()

    // 有効期限が切れた「キャンセル中」ユーザーを無料会員に変更
    const { data: expiredCancelling, error: cancellingError } = await supabaseAdmin
      .from(TABLES.PROFILES)
      .update({ membership_status: "free", payjp_subscription_id: null })
      .eq("membership_status", "cancelling")
      .lt("membership_expires_at", now)
      .select("id")

    if (cancellingError) {
      console.error("[v0] Error updating cancelling users:", cancellingError)
    }

    // 有効期限が切れた「有料会員」（Webhookが届かなかった場合のフォールバック）
    // 通常はWebhookで処理されるが、念のため
    const { data: expiredPremium, error: premiumError } = await supabaseAdmin
      .from(TABLES.PROFILES)
      .update({ membership_status: "free", payjp_subscription_id: null })
      .eq("membership_status", "premium")
      .lt("membership_expires_at", now)
      .is("payjp_subscription_id", null) // サブスクリプションIDがない場合のみ
      .select("id")

    if (premiumError) {
      console.error("[v0] Error updating expired premium users:", premiumError)
    }

    const processedCount = (expiredCancelling?.length || 0) + (expiredPremium?.length || 0)

    console.log(`[v0] Subscription check completed. Processed: ${processedCount} users`)

    return NextResponse.json({
      success: true,
      processed: processedCount,
      cancellingExpired: expiredCancelling?.length || 0,
      premiumExpired: expiredPremium?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Subscription check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
