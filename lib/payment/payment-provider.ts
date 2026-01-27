// 決済プロバイダーの共通インターフェース
export type PaymentProvider = "stripe" | "square"

export interface PaymentSession {
  url: string
  sessionId: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number // 円
  interval: "month" | "year"
  features: string[]
}

// プラン定義
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  monthly: {
    id: "monthly",
    name: "月額プラン",
    price: 980,
    interval: "month",
    features: ["マッチした相手にメッセージ送信", "いいね無制限", "プロフィール閲覧無制限", "グループチャット参加"],
  },
  monthly_mirahlo: {
    id: "monthly_mirahlo",
    name: "月額プラン（ミライロ提携）",
    price: 480,
    interval: "month",
    features: [
      "マッチした相手にメッセージ送信",
      "いいね無制限",
      "プロフィール閲覧無制限",
      "グループチャット参加",
      "ミライロ会員特別価格",
    ],
  },
}

// 現在の決済プロバイダーを取得
export function getPaymentProvider(): PaymentProvider {
  return (process.env.PAYMENT_PROVIDER as PaymentProvider) || "stripe"
}
