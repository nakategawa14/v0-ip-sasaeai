import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Eye, Calendar } from "lucide-react"
import Link from "next/link"
import { TABLES } from "@/lib/supabase/table-names"
import { getProfileVisitors } from "@/lib/actions/profile-views"

export default async function ProfileVisitorsPage() {
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

  const { visitors, error } = await getProfileVisitors(50)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      return "たった今"
    } else if (diffHours < 24) {
      return `${diffHours}時間前`
    } else if (diffDays < 7) {
      return `${diffDays}日前`
    } else {
      return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={currentProfile} />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">プロフィール訪問者</h1>
          <p className="mt-2 text-gray-600">
            あなたのプロフィールを訪れた{visitors.length}人のユーザーを表示しています
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-4">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {visitors.length === 0 ? (
          <Card className="p-12 text-center">
            <Eye className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">訪問者はまだいません</h2>
            <p className="mt-2 text-gray-600">あなたのプロフィールを訪れたユーザーがいると、ここに表示されます</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {visitors.map((visit: any) => {
              const visitorProfile = visit.viewer?.sasaeai_profiles?.[0]
              if (!visitorProfile) return null

              return (
                <Link key={visit.id} href={`/profile/${visit.viewer.id}`}>
                  <Card className="p-4 transition-all hover:shadow-md hover:border-pink-300">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={visitorProfile.avatar_url || "/placeholder.svg"}
                          alt={visitorProfile.nickname}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-blue-400 text-white">
                          {getInitials(visitorProfile.nickname)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{visitorProfile.nickname}</h3>
                          {visitorProfile.is_verified && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              本人確認済み
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          {visitorProfile.age && <span>{visitorProfile.age}歳</span>}
                          {visitorProfile.gender && (
                            <span>
                              {visitorProfile.gender === "male"
                                ? "男性"
                                : visitorProfile.gender === "female"
                                  ? "女性"
                                  : "その他"}
                            </span>
                          )}
                          {visitorProfile.prefecture && <span>{visitorProfile.prefecture}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(visit.viewed_at)}
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
