// 決済サービス（StripeとSquareの共通インターフェース）

import { getPaymentProvider, type PaymentSession, type SubscriptionPlan, SUBSCRIPTION_PLANS } from "./payment-provider"
import { createSquareCheckoutSession } from "./square-client"

// Stripe用（既存のStripe統合を使用）
async function createStripeCheckoutSession(
  plan: SubscriptionPlan,
  userId: string,
  couponCode?: string,
): Promise<PaymentSession> {
  // 既存のStripe実装を呼び出す
  // TODO: 既存のStripe実装と統合
  throw new Error("Stripe integration not yet implemented in unified service")
}

// 決済セッションを作成（プロバイダー自動選択）
export async function createCheckoutSession(
  planId: string,
  userId: string,
  couponCode?: string,
): Promise<PaymentSession> {
  const plan = SUBSCRIPTION_PLANS[planId]
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`)
  }

  const provider = getPaymentProvider()

  if (provider === "square") {
    return createSquareCheckoutSession(plan, userId, couponCode)
  } else {
    return createStripeCheckoutSession(plan, userId, couponCode)
  }
}
