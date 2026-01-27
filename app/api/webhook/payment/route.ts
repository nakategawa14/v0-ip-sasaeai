import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"

export async function POST(request: Request) {
  try {
    // TODO: PAY.JPまたは他の決済サービスのwebhook署名検証

    const body = await request.json()

    // イベントタイプに応じた処理
    switch (body.type) {
      case "subscription.renewed":
        // サブスクリプション更新
        await handleSubscriptionRenewed(body.data)
        break

      case "subscription.cancelled":
        // サブスクリプションキャンセル
        await handleSubscriptionCancelled(body.data)
        break

      case "payment.succeeded":
        // 決済成功
        await handlePaymentSucceeded(body.data)
        break

      case "payment.failed":
        // 決済失敗
        await handlePaymentFailed(body.data)
        break

      default:
        console.log(`Unhandled event type: ${body.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleSubscriptionRenewed(data: any) {
  const supabase = await createServerSupabaseClient()

  const membershipExpiresAt = new Date()
  membershipExpiresAt.setMonth(membershipExpiresAt.getMonth() + 1)

  await supabase
    .from(TABLES.PROFILES)
    .update({
      membership_status: "premium",
      membership_expires_at: membershipExpiresAt.toISOString(),
    })
    .eq("id", data.userId)

  await supabase.from("payments").insert({
    user_id: data.userId,
    amount: data.amount,
    payment_method: data.paymentMethod,
    payment_status: "completed",
    subscription_id: data.subscriptionId,
    payment_date: new Date().toISOString(),
    next_billing_date: membershipExpiresAt.toISOString(),
  })
}

async function handleSubscriptionCancelled(data: any) {
  const supabase = await createServerSupabaseClient()

  // 現在の有効期限まで利用可能、その後無料会員に
  // 実際の切り替えはcronジョブで実行
}

async function handlePaymentSucceeded(data: any) {
  console.log("Payment succeeded:", data)
}

async function handlePaymentFailed(data: any) {
  const supabase = await createServerSupabaseClient()

  await supabase
    .from(TABLES.PROFILES)
    .update({
      membership_status: "free",
    })
    .eq("id", data.userId)
}
