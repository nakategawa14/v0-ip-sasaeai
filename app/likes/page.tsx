import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCard } from "@/components/search/user-card"
import { TABLES } from "@/lib/supabase/table-names"

export default async function LikesPage() {
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

  const { data: blockedUsers } = await supabase.from(TABLES.BLOCKS).select("blocked_id").eq("blocker_id", user.id)

  const { data: blockedByUsers } = await supabase.from(TABLES.BLOCKS).select("blocker_id").eq("blocked_id", user.id)

  const blockedIds = [
    ...(blockedUsers?.map((b) => b.blocked_id) || []),
    ...(blockedByUsers?.map((b) => b.blocker_id) || []),
  ]

  // 受け取ったいいね
  let receivedLikesQuery = supabase.from(TABLES.LIKES).select("from_user_id").eq("to_user_id", user.id)

  if (blockedIds.length > 0) {
    receivedLikesQuery = receivedLikesQuery.not("from_user_id", "in", `(${blockedIds.join(",")})`)
  }

  const { data: receivedLikes } = await receivedLikesQuery

  // 送ったいいね
  let sentLikesQuery = supabase.from(TABLES.LIKES).select("to_user_id").eq("from_user_id", user.id)

  if (blockedIds.length > 0) {
    sentLikesQuery = sentLikesQuery.not("to_user_id", "in", `(${blockedIds.join(",")})`)
  }

  const { data: sentLikes } = await sentLikesQuery

  // 受け取ったいいねのプロフィールを取得
  const receivedUserIds = receivedLikes?.map((like) => like.from_user_id) || []
  let receivedProfiles: any[] = []
  if (receivedUserIds.length > 0) {
    const { data } = await supabase.from(TABLES.PROFILES).select("*").in("id", receivedUserIds)
    receivedProfiles = data || []
  }

  // 送ったいいねのプロフィールを取得
  const sentUserIds = sentLikes?.map((like) => like.to_user_id) || []
  let sentProfiles: any[] = []
  if (sentUserIds.length > 0) {
    const { data } = await supabase.from(TABLES.PROFILES).select("*").in("id", sentUserIds)
    sentProfiles = data || []
  }

  // 自分が送ったいいねのIDリスト
  const likedUserIds = sentProfiles.map((p: any) => p.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={currentProfile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">いいね</h1>
          <p className="text-gray-600">あなたのいいねを確認しましょう</p>
        </div>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="received">受け取ったいいね ({receivedProfiles.length})</TabsTrigger>
            <TabsTrigger value="sent">送ったいいね ({sentProfiles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-6">
            {receivedProfiles.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {receivedProfiles.map((profile: any) => (
                  <UserCard
                    key={profile.id}
                    profile={profile}
                    currentUserId={user.id}
                    hasLiked={likedUserIds.includes(profile.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-600">まだいいねを受け取っていません</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-6">
            {sentProfiles.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sentProfiles.map((profile: any) => (
                  <UserCard key={profile.id} profile={profile} currentUserId={user.id} hasLiked={true} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-600">まだいいねを送っていません</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
