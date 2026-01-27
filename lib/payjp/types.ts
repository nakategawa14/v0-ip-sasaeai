// PAY.JP API Types

export interface PayjpCustomer {
  id: string
  object: "customer"
  created: number
  default_card: string | null
  description: string | null
  email: string | null
  livemode: boolean
  metadata: Record<string, string>
  cards: {
    count: number
    data: PayjpCard[]
  }
  subscriptions: {
    count: number
    data: PayjpSubscription[]
  }
}

export interface PayjpCard {
  id: string
  object: "card"
  created: number
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  name: string | null
  fingerprint: string
}

export interface PayjpSubscription {
  id: string
  object: "subscription"
  created: number
  current_period_end: number
  current_period_start: number
  customer: string
  plan: PayjpPlan
  status: "active" | "trial" | "canceled" | "paused"
  canceled_at: number | null
  paused_at: number | null
  resumed_at: number | null
  prorate: boolean
  metadata: Record<string, string>
}

export interface PayjpPlan {
  id: string
  object: "plan"
  created: number
  amount: number
  currency: string
  interval: "month" | "year"
  name: string | null
  trial_days: number | null
  billing_day: number | null
  metadata: Record<string, string>
}

export interface PayjpCharge {
  id: string
  object: "charge"
  created: number
  amount: number
  currency: string
  customer: string | null
  description: string | null
  captured: boolean
  paid: boolean
  refunded: boolean
  failure_code: string | null
  failure_message: string | null
  metadata: Record<string, string>
}

export interface PayjpWebhookEvent {
  id: string
  object: "event"
  type: string
  livemode: boolean
  created: number
  data: any
  pending_webhooks: number
}

// Webhook Event Types
export type PayjpEventType =
  | "customer.created"
  | "customer.updated"
  | "customer.deleted"
  | "customer.card.created"
  | "customer.card.deleted"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.deleted"
  | "subscription.renewed"
  | "subscription.canceled"
  | "subscription.paused"
  | "subscription.resumed"
  | "charge.succeeded"
  | "charge.failed"
  | "charge.updated"
  | "charge.refunded"
