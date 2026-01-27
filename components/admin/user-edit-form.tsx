"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import { TABLES } from "@/lib/supabase/table-names"
import { Save } from "lucide-react"

export function UserEditForm({ user }: { user: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    display_name: user.display_name || "",
    nickname: user.nickname || "",
    user_type: user.user_type || "general",
    subscription_plan: user.subscription_plan || "free",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from(TABLES.PROFILES)
        .update({
          display_name: formData.display_name,
          nickname: formData.nickname,
          user_type: formData.user_type,
          subscription_plan: formData.subscription_plan,
        })
        .eq("id", user.id)

      if (updateError) {
        setError("ユーザー情報の更新に失敗しました")
        return
      }

      setSuccess("ユーザー情報を更新しました")
      router.refresh()
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-semibold">ユーザー情報編集</h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {success && <Alert className="mb-4 border-green-500 bg-green-50 text-green-900">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="display_name">表示名</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="nickname">ニックネーム</Label>
          <Input
            id="nickname"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="user_type">ユーザータイプ</Label>
          <Select
            value={formData.user_type}
            onValueChange={(value) => setFormData({ ...formData, user_type: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">一般</SelectItem>
              <SelectItem value="support">サポーター</SelectItem>
              <SelectItem value="both">両方</SelectItem>
              <SelectItem value="moderator">モデレーター</SelectItem>
              <SelectItem value="admin">管理者</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subscription_plan">プラン</Label>
          <Select
            value={formData.subscription_plan}
            onValueChange={(value) => setFormData({ ...formData, subscription_plan: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">無料</SelectItem>
              <SelectItem value="premium">有料</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          保存
        </Button>
      </form>
    </Card>
  )
}
