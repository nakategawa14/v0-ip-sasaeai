"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { isWhitelisted, MAINTENANCE_MODE } from "@/lib/config/maintenance"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (MAINTENANCE_MODE && !isWhitelisted(email)) {
      setError(
        "現在、サービス準備中のため一般ユーザーのログインを一時停止しております。2025年4月のサービス開始をお待ちください。",
      )
      return
    }

    setLoading(true)

    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError("メールアドレスまたはパスワードが正しくありません")
        return
      }

      if (data.user) {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("ログイン中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "ログイン中..." : "ログイン"}
      </Button>

      <div className="text-center">
        <a href="/forgot-password" className="text-sm text-pink-600 hover:text-pink-700">
          パスワードをお忘れですか？
        </a>
      </div>
    </form>
  )
}
