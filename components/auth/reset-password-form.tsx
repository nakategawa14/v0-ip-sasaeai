"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        setIsValidSession(true)
      } else {
        setError("パスワードリセットのリンクが無効または期限切れです。")
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません")
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError("パスワードの更新に失敗しました。もう一度お試しください。")
        return
      }

      setSuccess(true)

      // 3秒後にログイン画面へリダイレクト
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      setError("エラーが発生しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  if (!isValidSession && error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">{error}</Alert>
        <Button onClick={() => router.push("/forgot-password")} className="w-full">
          パスワードリセットを再試行
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <div className="ml-2">
            <p className="font-semibold">パスワードを更新しました</p>
            <p className="mt-1 text-sm">パスワードの更新が完了しました。ログイン画面に移動します...</p>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="space-y-2">
        <Label htmlFor="password">新しいパスワード</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <p className="text-sm text-gray-500">8文字以上で入力してください</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">パスワード（確認）</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading || !isValidSession}>
        {loading ? "更新中..." : "パスワードを更新"}
      </Button>
    </form>
  )
}
