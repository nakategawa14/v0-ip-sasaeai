import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { UserCard } from "@/components/search/user-card"
import { AdBanner } from "@/components/ads/ad-banner"

export default async function SentLikesPage() {
  const supabase = await createServerClient()

  // 現在のユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 送信済みいいねを取得
  const { data: sentLikes } = await supabase
    .from(TABLES.LIKES)
    .select(
      `
      to_user_id,
      created_at,
      profile:${TABLES.PROFILES}!${TABLES.LIKES}_to_user_id_fkey(
        user_id,
        nickname,
        bio,
        birthdate,
        prefecture,
        avatar_url,
        is_verified,
        gender
      )
    `,
    )
    .eq("from_user_id", user.id)
    .order("created_at", { ascending: false })

  const profiles = sentLikes?.map((like: any) => like.profile).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">送信済みいいね</h1>

        <AdBanner position="likes_top" className="mb-6" />

        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">まだいいねを送っていません</p>
            <a href="/search" className="text-primary hover:underline">
              ユーザーを探す
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile: any) => (
              <UserCard key={profile.user_id} profile={profile} />
            ))}
          </div>
        )}

        <AdBanner position="likes_bottom" className="mt-6" />
      </div>
    </div>
  )
}
