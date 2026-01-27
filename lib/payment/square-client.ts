// Square決済クライアント（準備版）

import type { PaymentSession, SubscriptionPlan } from "./payment-provider"

// Square APIクライアントの初期化
export function initializeSquareClient() {
  const applicationId = process.env.SQUARE_APPLICATION_ID
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId = process.env.SQUARE_LOCATION_ID

  if (!applicationId || !accessToken || !locationId) {
    throw new Error("Square credentials are not configured")
  }

  return {
    applicationId,
    accessToken,
    locationId,
  }
}

// Square Payment Linkを作成
export async function createSquareCheckoutSession(
  plan: SubscriptionPlan,
  userId: string,
  couponCode?: string,
): Promise<PaymentSession> {
  const { accessToken, locationId } = initializeSquareClient()

  // Square APIエンドポイント
  const squareApiUrl =
    process.env.SQUARE_ENVIRONMENT === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com"

  // 価格計算（クーポン適用）
  let finalPrice = plan.price
  if (couponCode === "MIRAHLO" && plan.id === "monthly") {
    finalPrice = 480 // ミライロクーポン適用
  }

  // Square Checkout APIリクエスト
  const response = await fetch(`${squareApiUrl}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Square-Version": "2024-01-18",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idempotency_key: `${userId}-${Date.now()}`,
      quick_pay: {
        name: plan.name,
        price_money: {
          amount: finalPrice * 100, // 円 → 銭
          currency: "JPY",
        },
        location_id: locationId,
      },
      checkout_options: {
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?provider=square&user_id=${userId}&plan_id=${plan.id}`,
        ask_for_shipping_address: false,
      },
      pre_populated_data: {
        buyer_email: "", // ユーザーのメールアドレスを設定
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Square API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()

  return {
    url: data.payment_link.url,
    sessionId: data.payment_link.id,
  }
}

// Square Webhookを検証
export function verifySquareWebhook(signature: string, body: string, webhookSignatureKey: string): boolean {
  const crypto = require("crypto")
  const hmac = crypto.createHmac("sha256", webhookSignatureKey)
  hmac.update(body)
  const expectedSignature = hmac.digest("base64")

  return signature === expectedSignature
}
