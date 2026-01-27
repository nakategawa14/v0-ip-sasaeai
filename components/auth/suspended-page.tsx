"use client"

import { AlertTriangle, Clock, Ban, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SuspendedPageProps {
  suspension: {
    type: "temporary" | "permanent"
    reason: string
    expires_at: string | null
  }
}

export function SuspendedPage({ suspension }: SuspendedPageProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString("ja-JP")} ${date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            {suspension.type === "permanent" ? (
              <Ban className="w-8 h-8 text-red-600" />
            ) : (
              <Clock className="w-8 h-8 text-orange-600" />
            )}
          </div>
          <CardTitle className="text-xl text-red-600">
            {suspension.type === "permanent" ? "アカウント停止" : "アカウント一時停止"}
          </CardTitle>
          <CardDescription>
            {suspension.type === "permanent"
              ? "あなたのアカウントは停止されました"
              : "あなたのアカウントは一時停止中です"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">停止理由</p>
                <p className="text-sm text-red-700 mt-1">{suspension.reason}</p>
              </div>
            </div>
          </div>

          {suspension.type === "temporary" && suspension.expires_at && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">停止期限</p>
                  <p className="text-sm text-orange-700 mt-1">{formatDate(suspension.expires_at)}</p>
                  <p className="text-xs text-orange-600 mt-2">上記日時以降、再度ログインできるようになります</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">お問い合わせ</p>
                <p className="text-sm text-gray-600 mt-1">
                  ご不明な点がございましたら、サポートまでお問い合わせください。
                </p>
                <a
                  href="mailto:support@sasaeai.help"
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  support@sasaeai.help
                </a>
              </div>
            </div>
          </div>

          <Button onClick={handleLogout} variant="outline" className="w-full bg-transparent">
            ログアウト
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
