"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { Send, CheckCircle } from "lucide-react"

export function ContactMessageReply({ message }: { message: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(message.admin_response || "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleReply = async () => {
    if (!response.trim()) {
      setError("返信内容を入力してください")
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({
          admin_response: response,
          status: "responded",
          responded_at: new Date().toISOString(),
        })
        .eq("id", message.id)

      if (updateError) {
        setError("返信の送信に失敗しました")
        return
      }

      setSuccess("返信を送信しました")
      setTimeout(() => {
        router.push("/admin/contact")
        router.refresh()
      }, 1500)
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({
          status: "resolved",
        })
        .eq("id", message.id)

      if (updateError) {
        setError("ステータスの更新に失敗しました")
        return
      }

      setSuccess("解決済みにしました")
      setTimeout(() => {
        router.push("/admin/contact")
        router.refresh()
      }, 1500)
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">問い合わせ詳細</h1>
        <p className="text-gray-600">問い合わせID: {message.id}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {success && <Alert className="mb-4 border-green-500 bg-green-50 text-green-900">{success}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <Badge
                variant={
                  message.status === "pending" ? "destructive" : message.status === "resolved" ? "default" : "secondary"
                }
              >
                {message.status === "pending" ? "未対応" : message.status === "responded" ? "返信済み" : "解決済み"}
              </Badge>
              <span className="text-sm text-gray-600">{new Date(message.created_at).toLocaleString("ja-JP")}</span>
            </div>

            <h2 className="mb-2 text-xl font-semibold">{message.subject}</h2>
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">返信</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="response">返信内容</Label>
                <Textarea
                  id="response"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="ユーザーへの返信を入力してください"
                  rows={8}
                  disabled={loading || message.status === "resolved"}
                />
              </div>

              <div className="flex gap-3">
                {message.status !== "resolved" && (
                  <>
                    <Button onClick={handleReply} disabled={loading}>
                      <Send className="mr-2 h-4 w-4" />
                      返信を送信
                    </Button>
                    <Button onClick={handleResolve} disabled={loading} variant="outline">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      解決済みにする
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">送信者情報</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">表示名</p>
                <p className="font-medium">{message.user?.display_name || "不明"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">メールアドレス</p>
                <p className="font-medium">{message.user?.email || "不明"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ユーザーID</p>
                <p className="font-mono text-xs text-gray-700">{message.user_id}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
