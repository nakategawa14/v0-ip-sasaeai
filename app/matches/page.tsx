import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { AdBanner } from "@/components/ads/ad-banner"
import { redirect } from "next/navigation"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { MatchCard } from "@/components/matches/match-card"

export default async function MatchesPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: matches } = await supabase
    .from(TABLES.MATCHES)
    .select("id, user1_id, user2_id, matched_at")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("is_active", true)
    .order("matched_at", { ascending: false })

  const matchedUserIds = matches?.map((match) => (match.user1_id === user.id ? match.user2_id : match.user1_id)) || []

  let profiles: any[] = []
  if (matchedUserIds.length > 0) {
    const { data } = await supabase
      .from(TABLES.PROFILES)
      .select("id, nickname, gender, birth_date, prefecture, bio, profile_images, is_verified")
      .in("id", matchedUserIds)
    profiles = data || []
  }

  const matchesWithProfiles = matches?.map((match) => {
    const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id
    const profile = profiles?.find((p) => p.id === partnerId)
    return {
      ...match,
      profile,
    }
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-20 md:pb-8">
      <h1 className="text-3xl font-bold mb-6">マッチング</h1>

      <AdBanner className="mb-6" />

      {!matchesWithProfiles || matchesWithProfiles.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">まだマッチングがありません</p>
          <p className="text-sm text-muted-foreground">気になる相手にいいねを送ってみましょう</p>
          <Link href="/search" className="inline-block mt-4 text-primary hover:underline">
            相手を探す
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matchesWithProfiles.map((match) => {
            if (!match.profile) return null
            return <MatchCard key={match.id} match={match as any} />
          })}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
