// PAY.JP 定期課金プランID
export const PAYJP_PLANS = {
  // 月額プラン（980円）
  MONTHLY: "sasaeai_monthly_980",
} as const

// プラン情報
export const PLAN_INFO = {
  [PAYJP_PLANS.MONTHLY]: {
    id: PAYJP_PLANS.MONTHLY,
    name: "ささえ愛 有料会員（月額）",
    amount: 980,
    interval: "month",
    description: "メッセージ送受信、マッチング無制限などすべての機能をご利用いただけます",
  },
} as const
