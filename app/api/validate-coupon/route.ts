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

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "クーポンコードを入力してください" }, { status: 400 })
    }

    // クーポンコードを検索
    const { data: coupon, error } = await supabase
      .from(TABLES.COUPON_CODES)
      .select("*")
      .eq("code", code.toUpperCase())
      .single()

    if (error || !coupon) {
      return NextResponse.json({ error: "無効なクーポンコードです" }, { status: 404 })
    }

    if (!coupon.is_active) {
      return NextResponse.json({ error: "このクーポンは現在利用できません" }, { status: 400 })
    }

    // 有効期限チェック
    const now = new Date()
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json({ error: "このクーポンはまだ利用できません" }, { status: 400 })
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json({ error: "このクーポンの有効期限が切れています" }, { status: 400 })
    }

    // 使用回数チェック
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json({ error: "このクーポンの利用上限に達しています" }, { status: 400 })
    }

    // 割引額を計算
    const basePrice = 1000
    let discountedPrice = basePrice

    if (coupon.discount_type === "percentage") {
      discountedPrice = Math.floor((basePrice * (100 - coupon.discount_value)) / 100)
    } else if (coupon.discount_type === "fixed_amount") {
      discountedPrice = Math.max(0, basePrice - coupon.discount_value)
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      },
      basePrice,
      discountedPrice,
      discountAmount: basePrice - discountedPrice,
    })
  } catch (error) {
    console.error("Coupon validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
