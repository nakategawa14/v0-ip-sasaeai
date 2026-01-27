import { createServerClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { redirect } from "next/navigation"
import { UserCard } from "@/components/search/user-card"
import { AdBanner } from "@/components/ads/ad-banner"
import Link from "next/link"

export default async function ReceivedLikesPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 受け取ったいいねを取得（to_user_id = 現在のユーザー）
  const { data: receivedLikes, error } = await supabase
    .from(TABLES.LIKES)
    .select(`
      from_user_id,
      created_at,
      from_profile:${TABLES.PROFILES}!${TABLES.LIKES}_from_user_id_fkey (
        user_id,
        nickname,
        age,
        prefecture,
        bio,
        avatar_url,
        is_verified
      )
    `)
    .eq("to_user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching received likes:", error)
  }

  const profiles = receivedLikes?.map((like: any) => like.from_profile).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">受け取ったいいね</h1>
          <p className="text-muted-foreground">あなたにいいねを送ってくれたユーザー</p>
        </div>

        <AdBanner slot="likes-top" className="mb-8" />

        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">まだいいねを受け取っていません</p>
            <Link href="/search" className="text-primary hover:underline">
              ユーザーを探す →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile: any) => (
              <UserCard key={profile.user_id} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
