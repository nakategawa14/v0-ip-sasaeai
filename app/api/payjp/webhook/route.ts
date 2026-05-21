import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { TABLES } from "@/lib/supabase/table-names"
import type { PayjpWebhookEvent } from "@/lib/payjp/types"

// Supabase Admin Client（Service Role Key使用）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const event: PayjpWebhookEvent = JSON.parse(body)

    // TODO: Webhook署名の検証（本番環境では必須）
    // const signature = request.headers.get("payjp-signature")
    // if (!verifySignature(body, signature)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    // }

    console.log(`[v0] PAY.JP Webhook received: ${event.type}`)

    switch (event.type) {
      case "subscription.renewed":
        await handleSubscriptionRenewed(event.data)
        break

      case "subscription.canceled":
        await handleSubscriptionCanceled(event.data)
        break

      case "subscription.deleted":
        await handleSubscriptionDeleted(event.data)
        break

      case "charge.succeeded":
        await handleChargeSucceeded(event.data)
        break

      case "charge.failed":
        await handleChargeFailed(event.data)
        break

      default:
        console.log(`[v0] Unhandled PAY.JP event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] PAY.JP Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

// 定期課金が更新された
async function handleSubscriptionRenewed(data: any) {
  const subscriptionId = data.id
  const customerId = data.customer

  // ユーザーを特定
  const { data: profile } = await supabaseAdmin
    .from(TABLES.PROFILES)
    .select("*")
    .eq("payjp_subscription_id", subscriptionId)
    .single()

  if (!profile) {
    console.error(`[v0] Profile not found for subscription: ${subscriptionId}`)
    return
  }

  // 有効期限を更新（1ヶ月後）
  const membershipExpiresAt = new Date()
  membershipExpiresAt.setMonth(membershipExpiresAt.getMonth() + 1)

  await supabaseAdmin
    .from(TABLES.PROFILES)
    .update({
      membership_status: "premium",
      membership_expires_at: membershipExpiresAt.toISOString(),
    })
    .eq("id", profile.id)

  // 決済履歴を記録
  await supabaseAdmin.from(TABLES.PAYMENTS).insert({
    user_id: profile.id,
    amount: profile.discounted_price || 980,
    payment_method: "payjp",
    payment_status: "completed",
    payjp_subscription_id: subscriptionId,
    payjp_customer_id: customerId,
    payment_date: new Date().toISOString(),
    next_billing_date: membershipExpiresAt.toISOString(),
    coupon_code: profile.coupon_code,
    notes: "定期課金更新",
  })

  console.log(`[v0] Subscription renewed for user: ${profile.id}`)
}

// 定期課金がキャンセルされた
async function handleSubscriptionCanceled(data: any) {
  const subscriptionId = data.id

  const { data: profile } = await supabaseAdmin
    .from(TABLES.PROFILES)
    .select("*")
    .eq("payjp_subscription_id", subscriptionId)
    .single()

  if (!profile) {
    console.error(`[v0] Profile not found for subscription: ${subscriptionId}`)
    return
  }

  // ステータスをキャンセル処理中に変更
  await supabaseAdmin
    .from(TABLES.PROFILES)
    .update({
      membership_status: "cancelling",
    })
    .eq("id", profile.id)

  console.log(`[v0] Subscription canceled for user: ${profile.id}`)
}

// 定期課金が削除された（即時停止）
async function handleSubscriptionDeleted(data: any) {
  const subscriptionId = data.id

  const { data: profile } = await supabaseAdmin
    .from(TABLES.PROFILES)
    .select("*")
    .eq("payjp_subscription_id", subscriptionId)
    .single()

  if (!profile) {
    console.error(`[v0] Profile not found for subscription: ${subscriptionId}`)
    return
  }

  // 無料会員に戻す
  await supabaseAdmin
    .from(TABLES.PROFILES)
    .update({
      membership_status: "free",
      payjp_subscription_id: null,
    })
    .eq("id", profile.id)

  console.log(`[v0] Subscription deleted for user: ${profile.id}`)
}

// 支払いが成功した
async function handleChargeSucceeded(data: any) {
  console.log(`[v0] Charge succeeded: ${data.id}`)
  // 必要に応じて追加処理
}

// 支払いが失敗した
async function handleChargeFailed(data: any) {
  const customerId = data.customer

  if (!customerId) return

  const { data: profile } = await supabaseAdmin
    .from(TABLES.PROFILES)
    .select("*")
    .eq("payjp_customer_id", customerId)
    .single()

  if (!profile) {
    console.error(`[v0] Profile not found for customer: ${customerId}`)
    return
  }

  // 決済履歴を記録
  await supabaseAdmin.from(TABLES.PAYMENTS).insert({
    user_id: profile.id,
    amount: data.amount || 0,
    payment_method: "payjp",
    payment_status: "failed",
    payjp_charge_id: data.id,
    payjp_customer_id: customerId,
    payment_date: new Date().toISOString(),
    notes: `決済失敗: ${data.failure_message || "不明なエラー"}`,
  })

  console.log(`[v0] Charge failed for user: ${profile.id}`)
}
