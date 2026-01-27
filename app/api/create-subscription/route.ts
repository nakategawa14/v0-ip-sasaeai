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

    const { couponCode, paymentMethodId } = await request.json()

    // クーポンコードの検証
    let discountedPrice = 1000
    let validCoupon = null

    if (couponCode) {
      const { data: coupon } = await supabase
        .from(TABLES.COUPON_CODES)
        .select("*")
        .eq("code", couponCode)
        .eq("is_active", true)
        .single()

      const now = new Date()
      const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null
      const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null

      if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
        if (!coupon.max_uses || coupon.current_uses < coupon.max_uses) {
          validCoupon = coupon
          if (coupon.discount_type === "percentage") {
            discountedPrice = Math.floor((1000 * (100 - coupon.discount_value)) / 100)
          } else {
            discountedPrice = 1000 - coupon.discount_value
          }
        }
      }
    }

    // TODO: PAY.JP APIとの統合
    // ここでは実装のプレースホルダーを提供
    // 実際の決済処理は決済サービス選定後に実装

    /*
    例: PAY.JP統合の場合
    const payjp = require('payjp')(process.env.PAYJP_SECRET_KEY);
    
    const subscription = await payjp.subscriptions.create({
      customer: customerId,
      plan: 'sasaeai_monthly',
    });
    */

    // 仮の成功レスポンス（開発用）
    const subscriptionId = `sub_dev_${Date.now()}`
    const membershipExpiresAt = new Date()
    membershipExpiresAt.setMonth(membershipExpiresAt.getMonth() + 1)

    await supabase
      .from(TABLES.PROFILES)
      .update({
        membership_status: "premium",
        membership_started_at: new Date().toISOString(),
        membership_expires_at: membershipExpiresAt.toISOString(),
        coupon_code: validCoupon ? couponCode : null,
        discounted_price: discountedPrice,
      })
      .eq("id", user.id)

    // 決済履歴を記録
    await supabase.from("payments").insert({
      user_id: user.id,
      amount: discountedPrice,
      payment_method: "dev_payment",
      payment_status: "completed",
      subscription_id: subscriptionId,
      payment_date: new Date().toISOString(),
      next_billing_date: membershipExpiresAt.toISOString(),
      coupon_code: validCoupon ? couponCode : null,
    })

    // クーポン使用回数を更新
    if (validCoupon) {
      await supabase
        .from(TABLES.COUPON_CODES)
        .update({ current_uses: validCoupon.current_uses + 1 })
        .eq("id", validCoupon.id)
    }

    return NextResponse.json({
      success: true,
      subscriptionId,
      amount: discountedPrice,
      expiresAt: membershipExpiresAt.toISOString(),
    })
  } catch (error) {
    console.error("Subscription creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
