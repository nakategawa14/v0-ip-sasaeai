"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { isWhitelisted, MAINTENANCE_MODE } from "@/lib/config/maintenance"

export function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (MAINTENANCE_MODE && !isWhitelisted(email)) {
      setError("現在、サービス準備中のため新規登録を一時停止しております。2025年4月のサービス開始をお待ちください。")
      return
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません")
      return
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください")
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/profile/setup`,
        },
      })

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("User already registered")) {
          setError("このメールアドレスは既に登録されています。ログインしてください。")
          setTimeout(() => {
            router.push("/login")
          }, 2000)
          return
        }
        setError(`登録エラー: ${error.message}`)
        return
      }

      if (data.user) {
        // メール確認を促す
        router.push("/verify-email")
      }
    } catch (err) {
      setError(`登録中にエラーが発生しました: ${err instanceof Error ? err.message : "不明なエラー"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <Input
          id="password"
          type="password"
          placeholder="6文字以上"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">パスワード（確認）</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="パスワードを再入力"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "登録中..." : "新規登録"}
      </Button>

      <p className="text-xs text-gray-600 leading-relaxed">
        登録することで、
        <a href="/terms" className="text-pink-600 hover:text-pink-700">
          利用規約
        </a>
        および
        <a href="/privacy" className="text-pink-600 hover:text-pink-700">
          プライバシーポリシー
        </a>
        に同意したものとみなされます。
      </p>
    </form>
  )
}
