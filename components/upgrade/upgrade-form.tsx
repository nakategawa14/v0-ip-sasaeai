"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Check } from "lucide-react"

interface UpgradeFormProps {
  userId: string
}

export function UpgradeForm({ userId }: UpgradeFormProps) {
  const router = useRouter()
  const [couponCode, setCouponCode] = useState("")
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponValidated, setCouponValidated] = useState(false)
  const [couponInfo, setCouponInfo] = useState<any>(null)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setError(data.error)
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

    if (!agreed) {
      setError("利用規約に同意してください")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponValidated ? couponCode.trim() : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "サブスクリプションの作成に失敗しました")
        return
      }

      // 成功
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const displayPrice = couponInfo ? couponInfo.discountedPrice : 1000

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      <Alert className="border-blue-500 bg-blue-50 text-blue-800">
        決済システムは現在準備中です。PAY.JPまたはGMOペイメントゲートウェイとの統合後にご利用いただけます。
      </Alert>

      {/* クーポンコード入力 */}
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
            placeholder="MIRAIRO2025"
            disabled={loading || validatingCoupon}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleValidateCoupon}
            disabled={!couponCode.trim() || validatingCoupon || loading}
            className="bg-transparent"
          >
            {validatingCoupon ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : couponValidated ? (
              <Check className="h-4 w-4" />
            ) : (
              "適用"
            )}
          </Button>
        </div>

        {couponValidated && couponInfo && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            クーポンコード「{couponInfo.coupon.code}」が適用されました！
            {couponInfo.coupon.discount_type === "percentage" && (
              <span className="ml-1">（{couponInfo.coupon.discount_value}%割引）</span>
            )}
          </div>
        )}

        <p className="text-sm text-gray-600">クーポンコードをお持ちの場合は、割引料金でご利用いただけます</p>
      </div>

      {/* 料金表示 */}
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-gray-700">基本料金</span>
          <span className="text-gray-900">¥1,000</span>
        </div>

        {couponInfo && (
          <>
            <div className="mb-2 flex items-center justify-between text-green-600">
              <span>割引</span>
              <span>-¥{couponInfo.discountAmount}</span>
            </div>
            <div className="border-t pt-2" />
          </>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-gray-700">合計</span>
          <span className="text-2xl font-bold text-gray-900">
            ¥{displayPrice}
            <span className="text-sm font-normal text-gray-600">/月</span>
          </span>
        </div>
      </div>

      {/* 利用規約同意 */}
      <div className="flex items-start space-x-2">
        <Checkbox id="agreed" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} />
        <Label htmlFor="agreed" className="text-sm leading-relaxed">
          <a href="/terms" className="text-pink-600 hover:text-pink-700">
            利用規約
          </a>
          および
          <a href="/tokushoho" className="text-pink-600 hover:text-pink-700">
            特定商取引法
          </a>
          に同意します
        </Label>
      </div>

      {/* 送信ボタン */}
      <Button type="submit" size="lg" className="w-full" disabled={loading || !agreed}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            処理中...
          </>
        ) : (
          `¥${displayPrice}/月で有料会員に申し込む`
        )}
      </Button>

      <p className="text-center text-xs text-gray-600 leading-relaxed">
        この申し込みは、決済システム統合後に有効になります
      </p>
    </form>
  )
}
