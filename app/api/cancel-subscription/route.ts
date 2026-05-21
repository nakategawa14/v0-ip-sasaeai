import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

    if (!profile || profile.membership_status !== "premium") {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 })
    }

    // TODO: PAY.JP APIとの統合
    // サブスクリプションをキャンセル

    /*
    例: PAY.JP統合の場合
    const payjp = require('payjp')(process.env.PAYJP_SECRET_KEY);
    
    await payjp.subscriptions.delete(subscriptionId);
    */

    // 次回課金日の翌日に無料会員に戻るように設定
    // 実際の実装では、cronジョブまたはwebhookで処理

    // 決済履歴を更新
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)

    if (payments && payments.length > 0) {
      await supabase.from("payments").update({ payment_status: "cancelled" }).eq("id", payments[0].id)
    }

    return NextResponse.json({
      success: true,
      message: "サブスクリプションをキャンセルしました。次回課金日の翌日に無料会員に戻ります。",
      expiresAt: profile.membership_expires_at,
    })
  } catch (error) {
    console.error("Subscription cancellation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
