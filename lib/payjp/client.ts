// PAY.JP API Client
// サーバーサイドでのみ使用

const PAYJP_API_BASE = "https://api.pay.jp/v1"

interface PayjpRequestOptions {
  method: "GET" | "POST" | "DELETE"
  path: string
  body?: Record<string, any>
}

async function payjpRequest<T>(options: PayjpRequestOptions): Promise<T> {
  const secretKey = process.env.PAYJP_SECRET_KEY

  if (!secretKey) {
    throw new Error("PAYJP_SECRET_KEY is not configured")
  }

  const url = `${PAYJP_API_BASE}${options.path}`
  const headers: HeadersInit = {
    Authorization: `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  }

  const fetchOptions: RequestInit = {
    method: options.method,
    headers,
  }

  if (options.body && options.method !== "GET") {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(options.body)) {
      if (value !== undefined && value !== null) {
        if (typeof value === "object") {
          // metadataなどのネストされたオブジェクト対応
          for (const [subKey, subValue] of Object.entries(value)) {
            params.append(`${key}[${subKey}]`, String(subValue))
          }
        } else {
          params.append(key, String(value))
        }
      }
    }
    fetchOptions.body = params.toString()
  }

  console.log("[v0] PAY.JP Request:", options.method, options.path)

  const response = await fetch(url, fetchOptions)
  const data = await response.json()

  console.log("[v0] PAY.JP Response status:", response.status)
  console.log("[v0] PAY.JP Response data:", JSON.stringify(data).substring(0, 500))

  if (!response.ok) {
    console.error("[v0] PAY.JP Error:", data)
    throw new Error(data.error?.message || "PAY.JP API error")
  }

  return data as T
}

// 顧客を作成
export async function createCustomer(params: {
  card: string // トークンID
  email?: string
  description?: string
  metadata?: Record<string, string>
}) {
  return payjpRequest({
    method: "POST",
    path: "/customers",
    body: params,
  })
}

// 顧客を取得
export async function getCustomer(customerId: string) {
  return payjpRequest({
    method: "GET",
    path: `/customers/${customerId}`,
  })
}

// 顧客を削除
export async function deleteCustomer(customerId: string) {
  return payjpRequest({
    method: "DELETE",
    path: `/customers/${customerId}`,
  })
}

// 単発課金を作成
export async function createCharge(params: {
  amount: number
  currency?: string
  customer?: string
  card?: string
  description?: string
  capture?: boolean
  metadata?: Record<string, string>
}) {
  return payjpRequest({
    method: "POST",
    path: "/charges",
    body: {
      ...params,
      currency: params.currency || "jpy",
    },
  })
}

// 定期課金を作成
export async function createSubscription(params: {
  customer: string // 顧客ID
  plan: string // プランID
  prorate?: boolean
  metadata?: Record<string, string>
}) {
  return payjpRequest({
    method: "POST",
    path: "/subscriptions",
    body: params,
  })
}

// 定期課金を取得
export async function getSubscription(subscriptionId: string) {
  return payjpRequest({
    method: "GET",
    path: `/subscriptions/${subscriptionId}`,
  })
}

// 定期課金をキャンセル
export async function cancelSubscription(subscriptionId: string) {
  return payjpRequest({
    method: "POST",
    path: `/subscriptions/${subscriptionId}/cancel`,
  })
}

// 定期課金を一時停止
export async function pauseSubscription(subscriptionId: string) {
  return payjpRequest({
    method: "POST",
    path: `/subscriptions/${subscriptionId}/pause`,
  })
}

// 定期課金を再開
export async function resumeSubscription(subscriptionId: string) {
  return payjpRequest({
    method: "POST",
    path: `/subscriptions/${subscriptionId}/resume`,
  })
}

// 定期課金を削除（即時停止）
export async function deleteSubscription(subscriptionId: string) {
  return payjpRequest({
    method: "DELETE",
    path: `/subscriptions/${subscriptionId}`,
  })
}

// プランを取得
export async function getPlan(planId: string) {
  return payjpRequest({
    method: "GET",
    path: `/plans/${planId}`,
  })
}

// 支払いを取得
export async function getCharge(chargeId: string) {
  return payjpRequest({
    method: "GET",
    path: `/charges/${chargeId}`,
  })
}
