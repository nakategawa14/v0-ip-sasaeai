import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, Heart, MessageCircle } from "lucide-react"
import Link from "next/link"
import { TABLES } from "@/lib/supabase/table-names"

export default async function PricingPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {profile && <DashboardHeader profile={profile} />}

      <main className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold text-gray-900">料金プラン</h1>
          <p className="text-lg text-gray-600">あなたに合ったプランをお選びください</p>
        </div>

        <Card className="mb-8 border-blue-500 bg-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-bold text-blue-900">決済システム準備中</h3>
              <p className="text-sm leading-relaxed text-blue-800">
                現在、PAY.JPまたはGMOペイメントゲートウェイとの統合を進めています。
                <br />
                決済機能は準備が整い次第ご利用いただけます。
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* 無料プラン */}
          <Card className="relative overflow-hidden p-8">
            <Badge variant="secondary" className="mb-4">
              無料プラン
            </Badge>
            <h3 className="mb-2 text-3xl font-bold text-gray-900">無料会員</h3>
            <p className="mb-6 text-gray-600">基本機能を無料でお試し</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-gray-900">¥0</span>
              <span className="text-lg text-gray-600">/月</span>
            </div>

            <div className="mb-8 space-y-4">
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">プロフィール作成・閲覧</p>
                  <p className="text-sm text-gray-600">自分のプロフィールを作成し、他のユーザーを閲覧</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">いいね送信</p>
                  <p className="text-sm text-gray-600">気になる相手にいいねを送れます</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">シークレットモード</p>
                  <p className="text-sm text-gray-600">検索結果に表示されない（無料）</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-400">メッセージ送信</p>
                  <p className="text-sm text-gray-500">有料会員限定</p>
                </div>
              </div>
            </div>

            <Button variant="outline" size="lg" className="w-full bg-transparent" disabled>
              現在のプラン
            </Button>
          </Card>

          {/* 有料プラン */}
          <Card className="relative overflow-hidden border-2 border-pink-500 p-8 shadow-xl">
            <div className="absolute right-0 top-0 bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-2 text-sm font-semibold text-white">
              おすすめ
            </div>
            <Badge variant="default" className="mb-4">
              有料プラン
            </Badge>
            <h3 className="mb-2 text-3xl font-bold text-gray-900">有料会員</h3>
            <p className="mb-6 text-gray-600">すべての機能を利用可能</p>
            <div className="mb-8">
              <span className="text-5xl font-bold text-gray-900">¥980</span>
              <span className="text-lg text-gray-600">/月</span>
            </div>

            <div className="mb-8 space-y-4">
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">無料プランのすべて</p>
                  <p className="text-sm text-gray-600">無料機能に加えて</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-pink-500" />
                <div>
                  <p className="font-semibold text-pink-900">メッセージ送受信</p>
                  <p className="text-sm text-gray-600">マッチングした相手と自由にやり取り</p>
                </div>
              </div>
            </div>

            {profile ? (
              profile.membership_status === "premium" ? (
                <Button size="lg" className="w-full" disabled>
                  ご利用中
                </Button>
              ) : (
                <Link href="/upgrade">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    有料会員になる
                  </Button>
                </Link>
              )
            ) : (
              <Link href="/signup">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  無料で始める
                </Button>
              </Link>
            )}
          </Card>
        </div>

        <div className="mt-12 rounded-lg bg-gray-50 p-8">
          <h3 className="mb-4 text-xl font-bold text-gray-900">よくある質問</h3>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold text-gray-900">Q. 無料プランで何ができますか？</h4>
              <p className="text-gray-700">
                プロフィール作成・閲覧、いいね送信、シークレットモードをご利用いただけます。メッセージ機能は有料会員限定です。
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-gray-900">Q. 途中でプラン変更できますか？</h4>
              <p className="text-gray-700">はい、いつでも有料プランへのアップグレード、または解約が可能です。</p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-gray-900">Q. 解約方法は？</h4>
              <p className="text-gray-700">
                設定ページからいつでも解約できます。解約すると次回課金日の翌日に無料会員に戻ります。
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-gray-900">Q. クーポンコードはありますか？</h4>
              <p className="text-gray-700">
                提携団体向けのクーポンコードを提供しています。お持ちの場合は申し込み時に入力してください。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
