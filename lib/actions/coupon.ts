"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { revalidatePath } from "next/cache"

export async function applyCouponToExistingMember(couponCode: string) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  // プロフィール取得
  const { data: profile, error: profileError } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: "プロフィールが見つかりません" }
  }

  // 無料会員はクーポン適用不可
  if (!profile.is_premium) {
    return { success: false, error: "有料会員のみクーポンを適用できます" }
  }

  // 既にクーポン適用済み
  if (profile.coupon_code) {
    return { success: false, error: "既にクーポンが適用されています" }
  }

  // クーポンコード検証（validate-coupon APIと同じロジック）
  const { data: coupon, error: couponError } = await supabase
    .from(TABLES.COUPONS)
    .select("*")
    .eq("code", couponCode.toUpperCase())
    .single()

  if (couponError || !coupon) {
    return { success: false, error: "無効なクーポンコードです" }
  }

  if (!coupon.is_active) {
    return { success: false, error: "このクーポンは無効です" }
  }

  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return { success: false, error: "このクーポンは利用上限に達しています" }
  }

  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    return { success: false, error: "このクーポンは有効期限切れです" }
  }

  // 割引額計算
  const basePrice = 1000
  let discountedPrice = basePrice

  if (coupon.discount_type === "percentage") {
    discountedPrice = basePrice - (basePrice * coupon.discount_value) / 100
  } else if (coupon.discount_type === "fixed") {
    discountedPrice = Math.max(0, basePrice - coupon.discount_value)
  }

  // プロフィール更新（次回請求から適用）
  const { error: updateError } = await supabase
    .from(TABLES.PROFILES)
    .update({
      coupon_code: coupon.code,
      discounted_price: discountedPrice,
      coupon_applied_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    return { success: false, error: "クーポンの適用に失敗しました" }
  }

  // クーポン使用回数を増やす
  await supabase
    .from(TABLES.COUPONS)
    .update({ current_uses: (coupon.current_uses || 0) + 1 })
    .eq("id", coupon.id)

  revalidatePath("/settings")

  return {
    success: true,
    message: `クーポン「${coupon.code}」を適用しました。次回請求（更新日）から¥${discountedPrice}/月になります。`,
    discountedPrice,
  }
}
