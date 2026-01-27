"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Loader2, CreditCard, AlertTriangle } from "lucide-react"
import { applyCouponToExistingMember } from "@/lib/actions/coupon"

interface SubscriptionManagerProps {
  profile: any
}

export function SubscriptionManager({ profile }: SubscriptionManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const [couponCode, setCouponCode] = useState("")
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("クーポンコードを入力してください")
      return
    }

    setApplyingCoupon(true)
    setCouponError(null)
    setCouponSuccess(null)

    const result = await applyCouponToExistingMember(couponCode.trim())

    if (result.success) {
      setCouponSuccess(result.message || "クーポンを適用しました")
      setCouponCode("")
      router.refresh()
    } else {
      setCouponError(result.error || "クーポンの適用に失敗しました")
    }

    setApplyingCoupon(false)
  }

  const handleCancelSubscription = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/payjp/cancel-subscription", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "キャンセルに失敗しました")
        return
      }

      setSuccess("サブスクリプションをキャンセルしました。現在の有効期限まで有料会員機能をご利用いただけます。")
      setShowCancelConfirm(false)
      router.refresh()
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  // 無料会員の場合
  if (profile.membership_status === "free") {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">
          有料会員になると、メッセージ送受信やマッチング無制限など、すべての機能をご利用いただけます。
        </p>
        <Link href="/upgrade">
          <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
            <CreditCard className="mr-2 h-4 w-4" />
            有料会員になる（月額¥980）
          </Button>
        </Link>
        <Link href="/pricing">
          <Button variant="outline" className="w-full bg-transparent">
            プラン詳細を見る
          </Button>
        </Link>
      </div>
    )
  }

  // キャンセル処理中の場合
  if (profile.membership_status === "cancelling") {
    return (
      <div className="space-y-4">
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            キャンセル処理中です。現在の有効期限まで有料会員機能をご利用いただけます。
          </AlertDescription>
        </Alert>
        {profile.membership_expires_at && (
          <p className="text-sm text-gray-600">
            有効期限:{" "}
            {new Date(profile.membership_expires_at).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
        <Link href="/upgrade">
          <Button variant="outline" className="w-full bg-transparent">
            再度有料会員に申し込む
          </Button>
        </Link>
      </div>
    )
  }

  // 有料会員の場合
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* クーポン適用（まだクーポンを使っていない場合） */}
      {!profile.coupon_code && profile.membership_status === "premium" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold text-blue-900">クーポンコードをお持ちですか？</h3>
          <p className="mb-4 text-sm text-blue-800">クーポンを適用すると、次回更新日から割引料金が適用されます。</p>

          {couponError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{couponError}</AlertDescription>
            </Alert>
          )}
          {couponSuccess && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <AlertDescription className="text-green-800">{couponSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="coupon" className="sr-only">
                クーポンコード
              </Label>
              <Input
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="クーポンコードを入力"
                disabled={applyingCoupon}
              />
            </div>
            <Button onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode.trim()}>
              {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "適用"}
            </Button>
          </div>
        </div>
      )}

      {/* キャンセル確認 */}
      {showCancelConfirm ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 font-semibold text-red-900">サブスクリプションをキャンセルしますか？</h3>
          <p className="mb-4 text-sm text-red-800">
            キャンセルすると、現在の有効期限（
            {profile.membership_expires_at &&
              new Date(profile.membership_expires_at).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            ）まで有料会員機能をご利用いただけます。その後は無料会員に戻ります。
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)} disabled={loading}>
              戻る
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  処理中...
                </>
              ) : (
                "キャンセルする"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full text-red-600 hover:bg-red-50 bg-transparent"
          onClick={() => setShowCancelConfirm(true)}
        >
          サブスクリプションをキャンセル
        </Button>
      )}

      <p className="text-xs text-gray-500">キャンセルしても、現在の有効期限まで有料会員機能をご利用いただけます</p>
    </div>
  )
}
