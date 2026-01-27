import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createCustomer, createCharge } from "@/lib/payjp/client"
import { TABLES } from "@/lib/supabase/table-names"

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const { token, couponCode } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "カード情報が必要です" }, { status: 400 })
    }

    // プロフィールを取得
    const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 })
    }

    // 既に有料会員の場合
    if (profile.membership_status === "premium") {
      return NextResponse.json({ error: "既に有料会員です" }, { status: 400 })
    }

    // クーポンの検証
    let discountedPrice = 980
    let validCoupon = null

    if (couponCode) {
      const { data: coupon } = await supabase
        .from(TABLES.COUPON_CODES)
        .select("*")
        .eq("code", couponCode)
        .eq("is_active", true)
        .single()

      if (coupon) {
        const now = new Date()
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null

        if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
          if (!coupon.max_uses || coupon.current_uses < coupon.max_uses) {
            validCoupon = coupon
            if (coupon.discount_type === "percentage") {
              discountedPrice = Math.floor((980 * (100 - coupon.discount_value)) / 100)
            } else {
              discountedPrice = Math.max(0, 980 - coupon.discount_value)
            }
          }
        }
      }
    }

    console.log("[v0] Creating PAY.JP customer with token:", token.substring(0, 20) + "...")

    // PAY.JPで顧客を作成
    const customer = (await createCustomer({
      card: token,
      email: profile.email || user.email,
      description: `ささえ愛ユーザー: ${profile.display_name}`,
      metadata: {
        user_id: user.id,
      },
    })) as any

    console.log("[v0] Customer created:", customer.id)

    const charge = (await createCharge({
      amount: discountedPrice,
      customer: customer.id,
      description: `ささえ愛 有料会員（月額） - ${profile.display_name}`,
      metadata: {
        user_id: user.id,
        coupon_code: validCoupon?.code || "",
      },
    })) as any

    console.log("[v0] Charge created:", charge.id)

    // 有効期限を計算（1ヶ月後）
    const membershipExpiresAt = new Date()
    membershipExpiresAt.setMonth(membershipExpiresAt.getMonth() + 1)

    // プロフィールを更新
    await supabase
      .from(TABLES.PROFILES)
      .update({
        membership_status: "premium",
        membership_started_at: new Date().toISOString(),
        membership_expires_at: membershipExpiresAt.toISOString(),
        payjp_customer_id: customer.id,
        coupon_code: validCoupon?.code || null,
        discounted_price: discountedPrice,
      })
      .eq("id", user.id)

    // 決済履歴を記録
    await supabase.from(TABLES.PAYMENTS).insert({
      user_id: user.id,
      amount: discountedPrice,
      payment_method: "payjp",
      payment_status: "completed",
      payjp_charge_id: charge.id,
      payjp_customer_id: customer.id,
      payment_date: new Date().toISOString(),
      next_billing_date: membershipExpiresAt.toISOString(),
      coupon_code: validCoupon?.code || null,
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
      customerId: customer.id,
      chargeId: charge.id,
      amount: discountedPrice,
      expiresAt: membershipExpiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error("[v0] PAY.JP create customer error:", error)
    return NextResponse.json({ error: error.message || "決済処理に失敗しました" }, { status: 500 })
  }
}
