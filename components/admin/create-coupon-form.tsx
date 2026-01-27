"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

export function CreateCouponForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [maxUses, setMaxUses] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [isActive, setIsActive] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    try {
      const { error } = await supabase.from("coupon_codes").insert({
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: Number.parseInt(discountValue),
        max_uses: maxUses ? Number.parseInt(maxUses) : null,
        valid_until: validUntil || null,
        is_active: isActive,
      })

      if (error) {
        setError("クーポンコードの作成に失敗しました")
        return
      }

      router.push("/admin/coupons")
      router.refresh()
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-2">
        <Label htmlFor="code">
          クーポンコード <span className="text-red-500">*</span>
        </Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          disabled={loading}
          placeholder="SUMMER2025"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="discountType">
          割引タイプ <span className="text-red-500">*</span>
        </Label>
        <Select value={discountType} onValueChange={setDiscountType} required disabled={loading}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">パーセンテージ</SelectItem>
            <SelectItem value="fixed_amount">固定金額</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="discountValue">
          割引値 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="discountValue"
          type="number"
          min="1"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          required
          disabled={loading}
          placeholder={discountType === "percentage" ? "50" : "500"}
        />
        <p className="text-sm text-gray-600">{discountType === "percentage" ? "割引率（%）" : "割引金額（円）"}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxUses">最大使用回数（任意）</Label>
        <Input
          id="maxUses"
          type="number"
          min="1"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          disabled={loading}
          placeholder="無制限"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="validUntil">有効期限（任意）</Label>
        <Input
          id="validUntil"
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="isActive" checked={isActive} onCheckedChange={(checked) => setIsActive(checked as boolean)} />
        <Label htmlFor="isActive">有効にする</Label>
      </div>

      <div className="flex gap-4">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "作成中..." : "クーポンコードを作成"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          キャンセル
        </Button>
      </div>
    </form>
  )
}
