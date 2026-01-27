import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SearchFilters } from "@/components/search/search-filters"
import { UserCard } from "@/components/search/user-card"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { TABLES } from "@/lib/supabase/table-names"
import { SearchDebug } from "@/components/search/search-debug"
import { Button } from "@/components/ui/button"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    gender?: string
    prefecture?: string
    area?: string
    age_min?: string
    age_max?: string
    user_type?: string
    disability_type?: string
    disability_detail?: string // 障がいの詳細パラメータを追加
    employment_type?: string
    living_situation?: string
    can_go_out_alone?: string
  }>
}) {
  const params = await searchParams

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: currentProfile } = await supabase.from(TABLES.PROFILES).select("*").eq("email", user.email).single()

  if (!currentProfile) {
    redirect("/profile/setup")
  }

  if (!currentProfile.is_verified) {
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader user={user} profile={currentProfile} />
        <main className="flex-1 container mx-auto px-4 py-6 pb-20">
          <h1 className="text-3xl font-bold mb-6">さがす</h1>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-8 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-orange-900 mb-4">本人確認が必要です</h2>
            <p className="text-orange-800 mb-6 leading-relaxed">
              お相手を検索するには、年齢確認と本人確認が必要です。
              <br />
              運転免許証またはマイナンバーカードをアップロードしてください。
            </p>

            {currentProfile.id_verification_image_url ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium">本人確認書類を提出済みです</p>
                <p className="text-blue-600 text-sm mt-2">
                  現在、管理者が審査中です。承認されると検索機能が使えるようになります。
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium">本人確認書類が未提出です</p>
                <p className="text-red-600 text-sm mt-2">
                  プロフィール編集ページから本人確認書類をアップロードしてください。
                </p>
              </div>
            )}

            <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
              <a href="/profile/edit">プロフィール編集ページへ</a>
            </Button>

            <p className="text-sm text-gray-600 mt-6">
              ※ 生年月日と顔写真のみが保存され、氏名・住所・免許番号は自動的に削除されます
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // ブロックしたユーザーとブロックされたユーザーを取得
  const { data: blockedUsers } = await supabase.from(TABLES.BLOCKS).select("blocked_id").eq("blocker_id", user.id)

  const { data: blockedByUsers } = await supabase.from(TABLES.BLOCKS).select("blocker_id").eq("blocked_id", user.id)

  const blockedIds = [
    ...(blockedUsers?.map((b) => b.blocked_id) || []),
    ...(blockedByUsers?.map((b) => b.blocker_id) || []),
  ]

  let query = supabase.from(TABLES.PROFILES).select("*").neq("id", currentProfile.id) // 自分以外

  if (blockedIds.length > 0) {
    query = query.not("id", "in", `(${blockedIds.join(",")})`)
  }

  if (params.gender) {
    query = query.eq("gender", params.gender)
  }
  if (params.prefecture) {
    query = query.eq("prefecture", params.prefecture)
  }
  if (params.area) {
    query = query.ilike("favorite_areas", `%${params.area}%`)
  }
  if (params.user_type) {
    query = query.eq("user_type", params.user_type)
  }
  if (params.disability_type) {
    query = query.contains("disability_type", [params.disability_type])
  }
  if (params.disability_detail) {
    query = query.or(`disability_details.cs.{${params.disability_detail}},bio.ilike.%${params.disability_detail}%`)
  }
  if (params.employment_type) {
    query = query.eq("employment_type", params.employment_type)
  }
  if (params.living_situation) {
    query = query.eq("living_situation", params.living_situation)
  }
  if (params.can_go_out_alone) {
    query = query.eq("can_go_out_alone", params.can_go_out_alone === "true")
  }

  const { data: profiles, error } = await query.order("created_at", { ascending: false }).limit(20)

  let validProfiles =
    profiles?.filter((profile) => {
      return profile && profile.id && profile.nickname && profile.gender
    }) || []

  // 年齢フィルターを適用
  if (params.age_min || params.age_max) {
    validProfiles = validProfiles.filter((profile) => {
      if (!profile.birth_date) return false

      const birthDate = new Date(profile.birth_date)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (params.age_min && age < Number.parseInt(params.age_min)) return false
      if (params.age_max && age > Number.parseInt(params.age_max)) return false

      return true
    })
  }

  const { data: likes } = await supabase.from(TABLES.LIKES).select("liked_id").eq("liker_id", currentProfile.id)

  const likedIds = new Set(likes?.map((like) => like.liked_id) || [])

  return (
    <div className="flex flex-col min-h-screen">
      <SearchDebug
        params={params}
        profileCount={profiles?.length || 0}
        blockedCount={blockedIds.length}
        error={error?.message}
        sampleProfile={profiles?.[0]}
      />

      <DashboardHeader user={user} profile={currentProfile} />
      <main className="flex-1 container mx-auto px-4 py-6 pb-20">
        <h1 className="text-3xl font-bold mb-6">さがす</h1>

        <SearchFilters currentFilters={params} />

        {error && (
          <div className="text-red-500 p-4 bg-red-50 rounded-lg mb-4">
            検索中にエラーが発生しました: {error.message}
          </div>
        )}

        {validProfiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">条件に合うユーザーが見つかりませんでした</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validProfiles.map((profile) => (
              <UserCard
                key={profile.id}
                profile={profile}
                currentUserId={currentProfile.id}
                hasLiked={likedIds.has(profile.id)}
              />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
