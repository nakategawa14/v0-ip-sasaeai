import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { TABLES } from "@/lib/supabase/table-names"
import {
  Users,
  Heart,
  MessageSquare,
  Eye,
  TrendingUp,
  Calendar,
  UserCheck,
  Mail,
  Clock,
  CheckCircle,
} from "lucide-react"

export default async function StatisticsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  if (!profile || !profile.is_admin) {
    redirect("/dashboard")
  }

  // 統計情報を取得
  const { count: totalUsers } = await supabase.from(TABLES.PROFILES).select("*", { count: "exact", head: true })

  const { count: verifiedUsers } = await supabase
    .from(TABLES.PROFILES)
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true)

  const { count: totalLikes } = await supabase.from(TABLES.LIKES).select("*", { count: "exact", head: true })

  let totalMatches = 0
  try {
    const { data: likes } = await supabase.from(TABLES.LIKES).select("from_user_id, to_user_id")
    if (likes) {
      const likeSet = new Set(likes.map((l) => `${l.from_user_id}-${l.to_user_id}`))
      let matchCount = 0
      likes.forEach((like) => {
        const reverseKey = `${like.to_user_id}-${like.from_user_id}`
        if (likeSet.has(reverseKey)) {
          matchCount++
        }
      })
      totalMatches = Math.floor(matchCount / 2)
    }
  } catch (error) {
    // エラー時は0を使用
  }

  const { count: totalMessages } = await supabase.from(TABLES.MESSAGES).select("*", { count: "exact", head: true })

  const { count: totalProfileViews } = await supabase
    .from(TABLES.PROFILE_VIEWS)
    .select("*", { count: "exact", head: true })

  // 過去30日の新規登録数
  const { count: newUsersLast30Days } = await supabase
    .from(TABLES.PROFILES)
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // 過去7日のアクティブユーザー数（いいね・マッチ・メッセージのいずれかを実行）
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: activeLikers } = await supabase
    .from(TABLES.LIKES)
    .select("from_user_id")
    .gte("created_at", sevenDaysAgo)

  const { data: activeMessagers } = await supabase
    .from(TABLES.MESSAGES)
    .select("sender_id")
    .gte("created_at", sevenDaysAgo)

  const activeUserIds = new Set([
    ...(activeLikers?.map((l) => l.from_user_id) || []),
    ...(activeMessagers?.map((m) => m.sender_id) || []),
  ])

  const activeUsers = activeUserIds.size

  // メール配信統計
  let totalEmailsSent = 0
  try {
    const { count } = await supabase.from(TABLES.EMAIL_LOGS).select("*", { count: "exact", head: true })
    totalEmailsSent = count || 0
  } catch (error) {
    // テーブルが存在しない場合は0
  }

  // 本人確認書類を提出したユーザー数
  const { count: totalVerificationSubmissions } = await supabase
    .from(TABLES.PROFILES)
    .select("*", { count: "exact", head: true })
    .not("id_verification_image_url", "is", null)

  // 承認済みユーザー数
  const { count: approvedVerifications } = await supabase
    .from(TABLES.PROFILES)
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true)
    .not("id_verification_image_url", "is", null)

  // 承認率の計算
  const verificationApprovalRate = totalVerificationSubmissions
    ? Math.round(((approvedVerifications || 0) / totalVerificationSubmissions) * 100)
    : 0

  let averageApprovalTime = 0
  try {
    const { data: verifiedProfiles } = await supabase
      .from(TABLES.PROFILES)
      .select("created_at, updated_at")
      .eq("is_verified", true)
      .not("id_verification_image_url", "is", null)
      .order("updated_at", { ascending: false })
      .limit(50)

    if (verifiedProfiles && verifiedProfiles.length > 0) {
      const approvalTimes: number[] = []
      for (const p of verifiedProfiles) {
        if (p.created_at && p.updated_at) {
          const createdTime = new Date(p.created_at).getTime()
          const updatedTime = new Date(p.updated_at).getTime()
          const diffHours = (updatedTime - createdTime) / (1000 * 60 * 60)
          if (diffHours > 0 && diffHours < 720) {
            // 30日以内の差分のみ
            approvalTimes.push(diffHours)
          }
        }
      }
      if (approvalTimes.length > 0) {
        averageApprovalTime = Math.round(approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length)
      }
    }
  } catch (error) {
    // エラー時はN/A
  }

  // 月別ユーザー登録数（過去12ヶ月）
  const monthlyRegistrations: { month: string; count: number }[] = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const { count } = await supabase
      .from(TABLES.PROFILES)
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString())

    monthlyRegistrations.push({
      month: `${monthStart.getFullYear()}/${monthStart.getMonth() + 1}`,
      count: count || 0,
    })
  }

  const maxMonthlyCount = Math.max(...monthlyRegistrations.map((m) => m.count), 1)

  const stats = [
    {
      title: "総ユーザー数",
      value: totalUsers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "本人確認済みユーザー",
      value: verifiedUsers || 0,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "本人確認承認率",
      value: `${verificationApprovalRate}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "平均承認時間",
      value: averageApprovalTime > 0 ? `${averageApprovalTime}h` : "N/A",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "総いいね数",
      value: totalLikes || 0,
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "総マッチ数",
      value: totalMatches,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "総メッセージ数",
      value: totalMessages || 0,
      icon: MessageSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "プロフィール閲覧数",
      value: totalProfileViews || 0,
      icon: Eye,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "過去30日の新規登録",
      value: newUsersLast30Days || 0,
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "過去7日のアクティブユーザー",
      value: activeUsers,
      icon: TrendingUp,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "送信済みメール数",
      value: totalEmailsSent,
      icon: Mail,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">統計ダッシュボード</h1>
          <p className="text-gray-600">ささえ愛の詳細統計情報</p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`rounded-full p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-xl font-semibold">月別ユーザー登録数（過去12ヶ月）</h2>
          <div className="space-y-3">
            {monthlyRegistrations.map((data) => (
              <div key={data.month} className="flex items-center gap-3">
                <span className="w-20 text-sm text-gray-600">{data.month}</span>
                <div className="flex-1">
                  <div className="h-8 w-full rounded-full bg-gray-200">
                    <div
                      className="h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center px-3 text-white text-sm font-medium"
                      style={{
                        width: `${(data.count / maxMonthlyCount) * 100}%`,
                        minWidth: data.count > 0 ? "60px" : "0",
                      }}
                    >
                      {data.count > 0 && data.count}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">エンゲージメント率</h2>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>本人確認率</span>
                  <span className="font-medium">
                    {totalUsers ? Math.round(((verifiedUsers || 0) / totalUsers) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{
                      width: `${totalUsers ? Math.round(((verifiedUsers || 0) / totalUsers) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>マッチ成功率（いいね→マッチ）</span>
                  <span className="font-medium">
                    {totalLikes ? Math.round(((totalMatches || 0) / totalLikes) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-purple-500"
                    style={{
                      width: `${totalLikes ? Math.round(((totalMatches || 0) / totalLikes) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>過去7日のアクティブ率</span>
                  <span className="font-medium">{totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-teal-500"
                    style={{
                      width: `${totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">その他の統計</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">本人確認申請数</span>
                <span className="font-medium">{totalVerificationSubmissions || 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">本人確認承認数</span>
                <span className="font-medium">{approvedVerifications || 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">ユーザーあたりの平均いいね数</span>
                <span className="font-medium">{totalUsers ? Math.round((totalLikes || 0) / totalUsers) : 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">ユーザーあたりの平均マッチ数</span>
                <span className="font-medium">{totalUsers ? Math.round((totalMatches || 0) / totalUsers) : 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">マッチあたりの平均メッセージ数</span>
                <span className="font-medium">
                  {totalMatches ? Math.round((totalMessages || 0) / totalMatches) : 0}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">ユーザーあたりのプロフィール閲覧数</span>
                <span className="font-medium">
                  {totalUsers ? Math.round((totalProfileViews || 0) / totalUsers) : 0}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
