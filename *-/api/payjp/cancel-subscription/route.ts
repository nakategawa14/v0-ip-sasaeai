import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { cancelSubscription } from "@/lib/payjp/client"
import { TABLES } from "@/lib/supabase/table-names"

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // プロフィールを取得
    const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 })
    }

    if (profile.membership_status !== "premium") {
      return NextResponse.json({ error: "有料会員ではありません" }, { status: 400 })
    }

    if (!profile.payjp_subscription_id) {
      return NextResponse.json({ error: "サブスクリプションが見つかりません" }, { status: 400 })
    }

    // PAY.JPでサブスクリプションをキャンセル
    await cancelSubscription(profile.payjp_subscription_id)

    // プロフィールを更新（キャンセル処理中に変更）
    await supabase
      .from(TABLES.PROFILES)
      .update({
        membership_status: "cancelling",
      })
      .eq("id", user.id)

    // 決済履歴を記録
    await supabase.from(TABLES.PAYMENTS).insert({
      user_id: user.id,
      amount: 0,
      payment_method: "payjp",
      payment_status: "cancelled",
      payjp_subscription_id: profile.payjp_subscription_id,
      payment_date: new Date().toISOString(),
      notes: "サブスクリプションキャンセル",
    })

    return NextResponse.json({
      success: true,
      message: "サブスクリプションをキャンセルしました。現在の有効期限まで有料会員機能をご利用いただけます。",
      expiresAt: profile.membership_expires_at,
    })
  } catch (error: any) {
    console.error("[v0] PAY.JP cancel subscription error:", error)
    return NextResponse.json({ error: error.message || "キャンセル処理に失敗しました" }, { status: 500 })
  }
}
