import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Heart, MessageCircle, Users, Shield, Eye } from "lucide-react"
import { PayjpCardForm } from "@/components/upgrade/payjp-card-form"
import { TABLES } from "@/lib/supabase/table-names"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function UpgradePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: currentProfile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  if (!currentProfile) {
    redirect("/profile/setup")
  }

  // 既に有料会員の場合
  if (currentProfile.membership_status === "premium") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
        <DashboardHeader profile={currentProfile} />

        <main className="container mx-auto max-w-3xl px-4 py-8">
          <Card className="p-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
                <Heart className="h-8 w-8 text-pink-600" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">有料会員ご利用中</h1>
            <p className="mb-6 text-gray-600">いつもご利用ありがとうございます</p>
            {currentProfile.membership_expires_at && (
              <p className="mb-6 text-sm text-gray-500">
                次回更新日:{" "}
                {new Date(currentProfile.membership_expires_at).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            <Link href="/settings">
              <Button variant="outline">設定ページへ</Button>
            </Link>
          </Card>
        </main>
      </div>
    )
  }

  // キャンセル処理中の場合
  if (currentProfile.membership_status === "cancelling") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
        <DashboardHeader profile={currentProfile} />

        <main className="container mx-auto max-w-3xl px-4 py-8">
          <Card className="p-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">キャンセル処理中</h1>
            <p className="mb-4 text-gray-600">現在の有効期限まで有料会員機能をご利用いただけます</p>
            {currentProfile.membership_expires_at && (
              <p className="text-sm text-gray-500">
                有効期限:{" "}
                {new Date(currentProfile.membership_expires_at).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={currentProfile} />

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">有料会員になる</h1>
          <p className="text-gray-600">すべての機能を利用して、素敵な出会いを見つけましょう</p>
        </div>

        <div className="mb-12 grid gap-8 md:grid-cols-2">
          {/* 無料会員 */}
          <Card className="p-8">
            <Badge variant="secondary" className="mb-4">
              現在のプラン
            </Badge>
            <h3 className="mb-4 text-2xl font-bold text-gray-900">無料会員</h3>
            <p className="mb-6 text-4xl font-bold text-gray-900">
              ¥0<span className="text-lg font-normal text-gray-600">/月</span>
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="h-5 w-5 text-green-500" />
                プロフィール作成・閲覧
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="h-5 w-5 text-green-500" />
                いいね送信
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="h-5 w-5 text-green-500" />
                シークレットモード
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <span className="text-gray-400">×</span>
                メッセージ送信
              </li>
            </ul>
          </Card>

          {/* 有料会員 */}
          <Card className="relative overflow-hidden border-2 border-pink-500 p-8">
            <div className="absolute right-0 top-0 bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-1 text-sm text-white">
              おすすめ
            </div>
            <Badge className="mb-4 bg-pink-100 text-pink-700">有料会員</Badge>
            <h3 className="mb-4 text-2xl font-bold text-gray-900">有料会員</h3>
            <div className="mb-6">
              <p className="text-4xl font-bold text-gray-900">
                ¥980<span className="text-lg font-normal text-gray-600">/月</span>
              </p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="h-5 w-5 text-green-500" />
                無料プランのすべて
              </li>
              <li className="flex items-center gap-2 font-semibold text-gray-900">
                <MessageCircle className="h-5 w-5 text-pink-500" />
                メッセージ送受信
              </li>
              <li className="flex items-center gap-2 font-semibold text-gray-900">
                <Users className="h-5 w-5 text-pink-500" />
                マッチング無制限
              </li>
              <li className="flex items-center gap-2 font-semibold text-gray-900">
                <Eye className="h-5 w-5 text-pink-500" />
                足あと機能
              </li>
              <li className="flex items-center gap-2 font-semibold text-gray-900">
                <Shield className="h-5 w-5 text-pink-500" />
                優先サポート
              </li>
            </ul>
          </Card>
        </div>

        {/* 申し込みフォーム */}
        <Card className="p-8">
          <h3 className="mb-6 text-2xl font-bold text-gray-900">お支払い情報</h3>
          <PayjpCardForm userId={user.id} />
        </Card>

        {/* 注意事項 */}
        <div className="mt-8 rounded-lg bg-gray-50 p-6 text-sm text-gray-600 leading-relaxed">
          <h4 className="mb-3 font-semibold text-gray-900">ご利用にあたって</h4>
          <ul className="ml-4 list-disc space-y-2">
            <li>月額料金は毎月自動で継続課金されます</li>
            <li>いつでも設定ページからキャンセル可能です</li>
            <li>キャンセルすると、現在の有効期限まで有料会員機能をご利用いただけます</li>
            <li>クーポンコードをお持ちの場合は、申し込み時に入力してください</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
