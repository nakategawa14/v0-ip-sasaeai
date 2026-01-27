"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Loader2, CreditCard, Lock, Check } from "lucide-react"

declare global {
  interface Window {
    Payjp: any
    __payjpInstance?: any
  }
}

interface PayjpCardFormProps {
  userId: string
  onSuccess?: () => void
}

export function PayjpCardForm({ userId, onSuccess }: PayjpCardFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [payjpLoaded, setPayjpLoaded] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponValidated, setCouponValidated] = useState(false)
  const [couponInfo, setCouponInfo] = useState<any>(null)
  const [domReady, setDomReady] = useState(false)

  const payjpInstance = useRef<any>(null)
  const cardElement = useRef<any>(null)
  const mountedRef = useRef(false)
  const unmountedRef = useRef(false)

  const initializePayjp = useCallback(() => {
    if (unmountedRef.current) {
      return
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY

    if (!publicKey) {
      setError("決済システムの設定エラーです")
      return
    }

    if (!window.Payjp) {
      return
    }

    const container = document.getElementById("payjp-card-element")
    if (!container) {
      return
    }

    if (mountedRef.current) {
      return
    }

    try {
      if (window.__payjpInstance) {
        payjpInstance.current = window.__payjpInstance
      } else {
        payjpInstance.current = window.Payjp(publicKey)
        window.__payjpInstance = payjpInstance.current
      }

      const elements = payjpInstance.current.elements()

      cardElement.current = elements.create("card", {
        style: {
          base: {
            fontSize: "16px",
            color: "#1f2937",
            "::placeholder": {
              color: "#9ca3af",
            },
          },
          invalid: {
            color: "#ef4444",
          },
        },
      })

      cardElement.current.mount("#payjp-card-element")
      mountedRef.current = true
      setPayjpLoaded(true)
      setError(null)
      console.log("[v0] PAY.JP initialized successfully")
    } catch (err: any) {
      console.error("[v0] PAY.JP initialization error:", err)
      if (err?.message?.includes("既にインスタンス化")) {
        // グローバルインスタンスを使用
        if (window.__payjpInstance) {
          payjpInstance.current = window.__payjpInstance
          try {
            const elements = payjpInstance.current.elements()
            cardElement.current = elements.create("card", {
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1f2937",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
                invalid: {
                  color: "#ef4444",
                },
              },
            })
            cardElement.current.mount("#payjp-card-element")
            mountedRef.current = true
            setPayjpLoaded(true)
            setError(null)
            return
          } catch (e) {
            // 無視
          }
        }
      }
      setError("決済システムの初期化に失敗しました: " + (err?.message || ""))
    }
  }, [])

  useEffect(() => {
    unmountedRef.current = false

    const publicKey = process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY

    if (!publicKey) {
      setError("決済システムの設定エラーです")
      return
    }

    if (window.Payjp) {
      setSdkReady(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://js.pay.jp/v2/pay.js"
    script.async = true
    script.onload = () => {
      console.log("[v0] PAY.JP SDK loaded")
      setSdkReady(true)
    }
    script.onerror = () => {
      setError("決済システムの読み込みに失敗しました")
    }
    document.body.appendChild(script)

    return () => {
      unmountedRef.current = true
      if (cardElement.current && mountedRef.current) {
        try {
          cardElement.current.unmount()
          mountedRef.current = false
        } catch (e) {
          // ignore
        }
      }
    }
  }, [])

  useEffect(() => {
    const checkDom = () => {
      const container = document.getElementById("payjp-card-element")
      if (container) {
        setDomReady(true)
      }
    }

    checkDom()

    const observer = new MutationObserver(checkDom)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (sdkReady && domReady && !mountedRef.current) {
      const timer = setTimeout(() => {
        initializePayjp()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [sdkReady, domReady, initializePayjp])

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return

    setValidatingCoupon(true)
    setError(null)
    setCouponValidated(false)
    setCouponInfo(null)

    try {
      const response = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "クーポンコードが無効です")
        return
      }

      setCouponValidated(true)
      setCouponInfo(data)
    } catch (err) {
      setError("クーポンコードの検証に失敗しました")
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    console.log("[v0] handleSubmit called")

    if (!agreed) {
      setError("利用規約に同意してください")
      return
    }

    if (!payjpLoaded || !cardElement.current || !payjpInstance.current) {
      setError("決済システムが読み込まれていません")
      return
    }

    setLoading(true)

    try {
      console.log("[v0] Creating token with payjpInstance.createToken...")
      console.log("[v0] cardElement.current:", cardElement.current)

      const result = await payjpInstance.current.createToken(cardElement.current)

      console.log("[v0] createToken result:", JSON.stringify(result, null, 2))

      if (result.error) {
        console.error("[v0] Token error:", result.error)
        setError(result.error.message || "カード情報が正しくありません")
        setLoading(false)
        return
      }

      const token = result.token || result
      console.log("[v0] Token object:", token)
      console.log("[v0] Token ID:", token?.id)

      if (!token?.id) {
        setError("トークンの作成に失敗しました。カード情報を確認してください。")
        setLoading(false)
        return
      }

      console.log("[v0] Calling API with token:", token.id)
      const response = await fetch("/api/payjp/create-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.id,
          couponCode: couponValidated ? couponCode.trim() : null,
        }),
      })

      console.log("[v0] API response status:", response.status)
      const data = await response.json()
      console.log("[v0] API response data:", data)

      if (!response.ok) {
        setError(data.error || "決済処理に失敗しました")
        setLoading(false)
        return
      }

      console.log("[v0] Payment successful, redirecting...")
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.href = "/payment/success"
      }
    } catch (err: any) {
      console.error("[v0] handleSubmit error:", err)
      setError(err.message || "エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const displayPrice = couponInfo ? couponInfo.discountedPrice : 980

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="couponCode">クーポンコード（任意）</Label>
        <div className="flex gap-2">
          <Input
            id="couponCode"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value)
              setCouponValidated(false)
              setCouponInfo(null)
            }}
            placeholder="クーポンコードを入力"
            disabled={loading || validatingCoupon}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleValidateCoupon}
            disabled={!couponCode.trim() || validatingCoupon || loading}
          >
            {validatingCoupon ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : couponValidated ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              "適用"
            )}
          </Button>
        </div>

        {couponValidated && couponInfo && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            クーポンが適用されました！
            {couponInfo.coupon?.discount_type === "percentage" && (
              <span className="ml-1">（{couponInfo.coupon.discount_value}%割引）</span>
            )}
          </div>
        )}
      </div>

      <Card className="bg-gray-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-gray-700">月額料金</span>
          <span className="text-gray-900">¥980</span>
        </div>

        {couponInfo && (
          <>
            <div className="mb-2 flex items-center justify-between text-green-600">
              <span>割引</span>
              <span>-¥{980 - couponInfo.discountedPrice}</span>
            </div>
            <div className="border-t pt-2" />
          </>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-gray-700">お支払い金額</span>
          <span className="text-2xl font-bold text-gray-900">
            ¥{displayPrice}
            <span className="text-sm font-normal text-gray-600">/月</span>
          </span>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-gray-600" />
          <Label>カード情報</Label>
        </div>

        <div
          id="payjp-card-element"
          className="rounded-md border border-gray-300 bg-white p-3 focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500"
          style={{ minHeight: "44px" }}
        />

        {!payjpLoaded && (
          <div className="flex items-center justify-center py-4 text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            決済フォームを読み込み中...
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Lock className="h-3 w-3" />
          <span>カード情報はPAY.JPにより安全に処理されます</span>
        </div>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox id="agreed" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} />
        <Label htmlFor="agreed" className="text-sm leading-relaxed">
          <a href="/terms" className="text-pink-600 hover:underline">
            利用規約
          </a>
          および
          <a href="/tokushoho" className="text-pink-600 hover:underline">
            特定商取引法に基づく表記
          </a>
          に同意します
        </Label>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        disabled={loading || !agreed || !payjpLoaded}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            処理中...
          </>
        ) : (
          `¥${displayPrice}/月で申し込む`
        )}
      </Button>

      <p className="text-center text-xs text-gray-500">毎月自動で課金されます。いつでもキャンセル可能です。</p>
    </form>
  )
}
