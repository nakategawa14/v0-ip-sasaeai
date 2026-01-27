import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Heart, MessageCircle } from "lucide-react"

export default async function PaymentSuccessPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-blue-50 p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">お支払い完了</h1>
          <p className="text-gray-600">
            有料会員へのアップグレードが完了しました。
            <br />
            すべての機能をお楽しみください！
          </p>
        </div>

        <div className="bg-pink-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-pink-900 mb-3 flex items-center justify-center gap-2">
            <Heart className="h-5 w-5" />
            利用できるようになった機能
          </h3>
          <ul className="text-sm text-pink-800 space-y-2">
            <li className="flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" />
              メッセージ送受信
            </li>
          </ul>
        </div>

        {profile?.membership_expires_at && (
          <p className="text-sm text-gray-500 mb-6">
            次回更新日:{" "}
            {new Date(profile.membership_expires_at).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        <div className="space-y-3">
          <Link href="/dashboard" className="block">
            <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
              ダッシュボードへ
            </Button>
          </Link>
          <Link href="/search" className="block">
            <Button variant="outline" className="w-full bg-transparent">
              お相手を探す
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
