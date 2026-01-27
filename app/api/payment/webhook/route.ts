// 決済Webhook処理

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getPaymentProvider } from "@/lib/payment/payment-provider"
import { verifySquareWebhook } from "@/lib/payment/square-client"
import { TABLE_NAMES } from "@/lib/supabase/table-names"

export async function POST(request: NextRequest) {
  try {
    const provider = getPaymentProvider()
    const body = await request.text()

    if (provider === "square") {
      // Square Webhook検証
      const signature = request.headers.get("x-square-signature") || ""
      const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || ""

      if (!verifySquareWebhook(signature, body, webhookSignatureKey)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }

      const event = JSON.parse(body)

      // 決済完了イベント
      if (event.type === "payment.updated" && event.data.object.payment.status === "COMPLETED") {
        const paymentId = event.data.object.payment.id
        const userId = event.data.object.payment.reference_id // userIdを設定する必要がある

        // ユーザーを有料会員に昇格
        const supabase = await createServerClient()
        await supabase
          .from(TABLE_NAMES.PROFILES)
          .update({
            is_premium: true,
            premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後
          })
          .eq("user_id", userId)

        console.log(`[v0] User ${userId} upgraded to premium via Square`)
      }
    } else if (provider === "stripe") {
      // Stripe Webhook処理（既存実装）
      // TODO: 既存のStripe Webhook実装と統合
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
