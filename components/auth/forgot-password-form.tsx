"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { Mail } from "lucide-react"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError("メールの送信に失敗しました。メールアドレスを確認してください。")
        return
      }

      setSuccess(true)
      setEmail("")
    } catch (err) {
      setError("エラーが発生しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <Mail className="h-4 w-4" />
          <div className="ml-2">
            <p className="font-semibold">メールを送信しました</p>
            <p className="mt-1 text-sm">パスワードリセット用のリンクをメールで送信しました。メールをご確認ください。</p>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <p className="text-sm text-gray-500">
          登録されたメールアドレスを入力してください。パスワードリセット用のリンクを送信します。
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "送信中..." : "リセットリンクを送信"}
      </Button>
    </form>
  )
}
