"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, CheckCircle, Send } from "lucide-react"

type EmailType =
  | "profile_image_reminder"
  | "license_reminder"
  | "selfie_reminder"
  | "new_visitor_notification"
  | "broadcast"

export function EmailSendForm() {
  const [emailType, setEmailType] = useState<EmailType>("broadcast")
  const [targetGender, setTargetGender] = useState<"all" | "female" | "male">("all")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSend = async () => {
    console.log("[v0 Client] 🔵 handleSend called")
    console.log("[v0 Client] emailType:", emailType)
    console.log("[v0 Client] targetGender:", targetGender)

    if (!confirm("メールを送信してもよろしいですか？送信後は取り消しできません。")) {
      console.log("[v0 Client] ❌ User cancelled")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      console.log("[v0 Client] 🟢 Calling API route...")

      const response = await fetch("/api/admin/send-bulk-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailType,
          targetGender,
        }),
      })

      const data = await response.json()
      console.log("[v0 Client] 🟢 API response:", data)

      if (!response.ok) {
        throw new Error(data.error || "送信に失敗しました")
      }

      setResult({
        success: true,
        message: data.message || "メール送信が完了しました",
      })
    } catch (error) {
      console.error("[v0 Client] ❌ Error:", error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "送信中にエラーが発生しました",
      })
    } finally {
      setLoading(false)
      console.log("[v0 Client] 🔵 handleSend finished")
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">通知タイプを選択</h2>
        <p className="mb-4 text-sm text-gray-600">送信する通知の種類を選択してください</p>

        <RadioGroup value={emailType} onValueChange={(value) => setEmailType(value as EmailType)}>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="profile_image_reminder" id="profile_image_reminder" />
              <Label htmlFor="profile_image_reminder" className="flex-1 cursor-pointer">
                <div className="font-medium">画像登録リマインダー</div>
                <div className="text-sm text-gray-600">24時間以上経過、画像未登録のユーザーに送信</div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="license_reminder" id="license_reminder" />
              <Label htmlFor="license_reminder" className="flex-1 cursor-pointer">
                <div className="font-medium">免許証未アップロードリマインダー</div>
                <div className="text-sm text-gray-600">免許証をアップロードしていないユーザーに送信</div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="selfie_reminder" id="selfie_reminder" />
              <Label htmlFor="selfie_reminder" className="flex-1 cursor-pointer">
                <div className="font-medium">自撮り未アップロードリマインダー</div>
                <div className="text-sm text-gray-600">自撮りをアップロードしていないユーザーに送信</div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="new_visitor_notification" id="new_visitor_notification" />
              <Label htmlFor="new_visitor_notification" className="flex-1 cursor-pointer">
                <div className="font-medium">足あとメール</div>
                <div className="text-sm text-gray-600">新しい足あとがあるユーザーに通知</div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="broadcast" id="broadcast" />
              <Label htmlFor="broadcast" className="flex-1 cursor-pointer">
                <div className="font-medium">全ユーザー通知</div>
                <div className="text-sm text-gray-600">すべてのアクティブユーザーに一斉送信</div>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">送信対象を選択</h2>
        <p className="mb-4 text-sm text-gray-600">メールを送信する対象ユーザーを指定してください</p>

        <RadioGroup value={targetGender} onValueChange={(value) => setTargetGender(value as any)}>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer">
                全ユーザー
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="cursor-pointer">
                女性のみ
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="cursor-pointer">
                男性のみ
              </Label>
            </div>
          </div>
        </RadioGroup>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Send className="h-5 w-5" />
          メール送信
        </h2>
        <p className="mb-4 text-sm text-gray-600">選択した条件に基づいてメールを送信します</p>

        <Button onClick={handleSend} disabled={loading} className="w-full" size="lg">
          {loading ? "送信中..." : "メール送信"}
        </Button>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            メール送信にはResend APIキーが必要です
          </p>
          <p className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            送信後は取り消しできませんのでご注意ください
          </p>
        </div>
      </Card>

      {result && (
        <Card className={`p-6 ${result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className={`font-medium ${result.success ? "text-green-900" : "text-red-900"}`}>
                {result.success ? "送信完了" : "送信失敗"}
              </p>
              <p className={`text-sm ${result.success ? "text-green-700" : "text-red-700"}`}>{result.message}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
