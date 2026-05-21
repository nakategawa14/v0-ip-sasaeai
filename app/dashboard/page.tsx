import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Users, Settings } from "lucide-react"
import Link from "next/link"
import { AdBanner } from "@/components/ads/ad-banner"
import { ProductCarousel } from "@/components/ads/product-carousel"
import { TABLES } from "@/lib/supabase/table-names"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { ForceLogoutButton } from "@/components/debug/force-logout-button"

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  if (!profile || !profile.nickname) {
    redirect("/profile/setup")
  }

  if ((profile as { status?: string }).status === "blocked") {
    redirect("/login?blocked=1")
  }

  // 統計情報を取得
  const { count: receivedLikes } = await supabase
    .from(TABLES.LIKES)
    .select("*", { count: "exact", head: true })
    .eq("to_user_id", user.id)

  let matchCount = 0
  try {
    const { data: sentLikes } = await supabase.from(TABLES.LIKES).select("to_user_id").eq("from_user_id", user.id)

    const { data: receivedLikesData } = await supabase
      .from(TABLES.LIKES)
      .select("from_user_id")
      .eq("to_user_id", user.id)

    if (sentLikes && receivedLikesData) {
      const sentToIds = new Set(sentLikes.map((l) => l.to_user_id))
      const receivedFromIds = new Set(receivedLikesData.map((l) => l.from_user_id))
      // 相互いいね = 自分が送った相手から受け取っている
      sentToIds.forEach((id) => {
        if (receivedFromIds.has(id)) {
          matchCount++
        }
      })
    }
  } catch (error) {
    // エラー時は0
  }

  let unreadMessages = 0
  try {
    const { count } = await supabase
      .from(TABLES.MESSAGES)
      .select("*", { count: "exact", head: true })
      .eq("is_read", false)
      .neq("sender_id", user.id)
    unreadMessages = count || 0
  } catch (error) {
    // エラー時は0
  }

  const { count: unreadNotifications } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} initialUnreadCount={unreadNotifications || 0} />

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <AdBanner position="top" />

        {/* ウェルカムメッセージ */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ようこそ、{profile.nickname}さん</h1>
          <p className="text-gray-600">素敵な出会いを見つけましょう</p>
        </div>

        <div className="mb-8">
          <ForceLogoutButton />
        </div>

        {!profile.is_verified && (
          <div className="mb-8 bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-900 mb-2">本人確認が必要です</h3>
                <p className="text-orange-800 mb-4">
                  お相手を検索するには、年齢確認と本人確認が必要です。
                  運転免許証またはマイナンバーカードをアップロードしてください。
                </p>

                {profile.id_verification_image_url ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-blue-800 text-sm font-medium">✓ 本人確認書類を提出済みです</p>
                    <p className="text-blue-600 text-xs mt-1">
                      現在、管理者が審査中です。承認までしばらくお待ちください。
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-800 text-sm font-medium">× 本人確認書類が未提出です</p>
                    <p className="text-red-600 text-xs mt-1">
                      プロフィール編集ページから本人確認書類をアップロードしてください。
                    </p>
                  </div>
                )}

                <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Link href="/profile/edit">本人確認書類をアップロードする</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 統計カード */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">受け取ったいいね</p>
                <p className="text-3xl font-bold text-gray-900">{receivedLikes || 0}</p>
              </div>
              <Heart className="h-8 w-8 text-pink-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">マッチング</p>
                <p className="text-3xl font-bold text-gray-900">{matchCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">未読メッセージ</p>
                <p className="text-3xl font-bold text-gray-900">{unreadMessages}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* クイックアクション */}
          <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
            <Card className="p-6">
              <Users className="mb-4 h-8 w-8 text-blue-500" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">新しい出会いを探す</h3>
              <p className="mb-4 text-gray-600 leading-relaxed">あなたに合った方を探してみましょう</p>
              <Button asChild>
                <Link href="/search">検索する</Link>
              </Button>
            </Card>

            <Card className="p-6">
              <MessageCircle className="mb-4 h-8 w-8 text-purple-500" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">メッセージ</h3>
              <p className="mb-4 text-gray-600 leading-relaxed">マッチングした方とメッセージを交換しましょう</p>
              <Button variant="outline" asChild>
                <Link href="/messages">メッセージを見る</Link>
              </Button>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
              <Users className="mb-4 h-8 w-8 text-purple-500" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">グループチャット</h3>
              <p className="mb-4 text-gray-600 leading-relaxed">みんなで楽しく会話しましょう</p>
              <Button variant="outline" asChild>
                <Link href="/group-chat">チャットに参加</Link>
              </Button>
            </Card>

            <Card className="p-6">
              <Settings className="mb-4 h-8 w-8 text-gray-500" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">プロフィール編集</h3>
              <p className="mb-4 text-gray-600 leading-relaxed">プロフィールを更新して魅力的にしましょう</p>
              <Button variant="outline" asChild>
                <Link href="/profile/edit">編集する</Link>
              </Button>
            </Card>

            {profile.membership_status === "free" && (
              <Card className="border-2 border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 p-6">
                <Heart className="h-8 w-8 text-pink-500" />
                {profile.gender === "male" ? (
                  <>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      (男性会員は) 有料会員になるとマッチした相手にメッセージ送信できるようになります（準備中）
                    </h3>
                    <p className="mb-4 text-sm text-gray-500 leading-relaxed">※クーポン提携については現在調整中です</p>
                    <Button className="bg-gradient-to-r from-pink-500 to-purple-500" asChild disabled>
                      <Link href="/upgrade">準備中</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">女性会員は完全無料です</h3>
                    <p className="mb-4 text-gray-600 leading-relaxed">
                      「ささえ愛」では、女性会員はすべての機能を無料でご利用いただけます。
                      マッチした相手とのメッセージ送信も無料です。安心してご利用ください。
                    </p>
                  </>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <ProductCarousel />
            <AdBanner position="sidebar" />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
