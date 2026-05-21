import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MatchList } from "@/components/messages/match-list"
import { Card } from "@/components/ui/card"
import { AdBanner } from "@/components/ads/ad-banner"
import { TABLES } from "@/lib/supabase/table-names"
import { BottomNav } from "@/components/navigation/bottom-nav"

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ match?: string }> }) {
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

  // マッチングリストを取得（リレーションなし）
  const { data: matches, error: matchesError } = await supabase
    .from(TABLES.MATCHES)
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("is_active", true)
    .order("matched_at", { ascending: false })

  // マッチ相手のプロフィールを取得
  const matchesWithProfiles = await Promise.all(
    (matches || []).map(async (match) => {
      // 相手のユーザーIDを特定
      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id

      // 相手のプロフィールを取得
      const { data: otherProfile } = await supabase
        .from(TABLES.PROFILES)
        .select("id, nickname, profile_images, user_type, gender")
        .eq("id", otherUserId)
        .single()

      // 最新メッセージを取得
      const { data: lastMessage } = await supabase
        .from(TABLES.MESSAGES)
        .select("*")
        .eq("match_id", match.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // 未読メッセージ数を取得
      const { count: unreadCount } = await supabase
        .from(TABLES.MESSAGES)
        .select("*", { count: "exact", head: true })
        .eq("match_id", match.id)
        .eq("receiver_id", user.id)
        .eq("is_read", false)

      return {
        ...match,
        otherUser: otherProfile,
        lastMessage,
        unreadCount: unreadCount || 0,
      }
    }),
  )

  // 選択されたマッチ
  const params = await searchParams
  const selectedMatchId = params.match

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={currentProfile} />

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <AdBanner position="top" adType="rakuten" />

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">メッセージ</h1>
          <p className="text-gray-600">マッチングした方とメッセージを交換しましょう</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* マッチリスト */}
          <div className="lg:col-span-1">
            <MatchList matches={matchesWithProfiles} currentUserId={user.id} />
          </div>

          {/* メッセージスレッド */}
          <div className="lg:col-span-2">
            <Card className="flex h-96 items-center justify-center p-12 text-center">
              <div>
                <p className="text-gray-600 mb-4">左のリストからマッチを選択してください</p>
                <p className="text-sm text-gray-500">クリックすると、メッセージ画面に移動します</p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
