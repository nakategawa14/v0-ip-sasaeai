import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Users, Shield, Flag, TrendingUp, MessageSquare, Ban, UserPlus, Eye, Heart, Mail } from "lucide-react"
import Link from "next/link"
import { AdminStatCardLink } from "@/components/admin/admin-stat-card-link"
import { fetchAdminHeaderProfile } from "@/lib/admin/auth"
import { TABLES } from "@/lib/supabase/table-names"

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 認可は app/admin/layout.tsx で実施
  const profile = user ? await fetchAdminHeaderProfile(user.id) : null

  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // 統計情報を取得
  const { count: totalUsers } = await supabase.from(TABLES.PROFILES).select("*", { count: "exact", head: true })

  const { count: premiumUsers } = await supabase
    .from(TABLES.PROFILES)
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true)

  const { count: pendingReports } = await supabase
    .from(TABLES.REPORTS)
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  let totalMatches = 0
  let newMatchesToday = 0

  try {
    // 相互いいね（マッチ）の数をカウント
    const { data: likes } = await supabase.from(TABLES.LIKES).select("from_user_id, to_user_id")

    if (likes) {
      // 相互いいねをカウント（A→BとB→Aの両方が存在するペアを数える）
      const likeSet = new Set(likes.map((l) => `${l.from_user_id}-${l.to_user_id}`))
      let matchCount = 0
      likes.forEach((like) => {
        const reverseKey = `${like.to_user_id}-${like.from_user_id}`
        if (likeSet.has(reverseKey)) {
          matchCount++
        }
      })
      totalMatches = Math.floor(matchCount / 2) // 両方向でカウントされるので2で割る
    }
  } catch (error) {
    // エラー時は0を使用
  }

  try {
    // 過去24時間の新規マッチ
    const { data: recentLikes } = await supabase
      .from(TABLES.LIKES)
      .select("from_user_id, to_user_id, created_at")
      .gte("created_at", last24Hours)

    if (recentLikes) {
      const { data: allLikes } = await supabase.from(TABLES.LIKES).select("from_user_id, to_user_id")

      if (allLikes) {
        const likeSet = new Set(allLikes.map((l) => `${l.from_user_id}-${l.to_user_id}`))
        let matchCount = 0
        recentLikes.forEach((like) => {
          const reverseKey = `${like.to_user_id}-${like.from_user_id}`
          if (likeSet.has(reverseKey)) {
            matchCount++
          }
        })
        newMatchesToday = Math.floor(matchCount / 2)
      }
    }
  } catch (error) {
    // エラー時は0を使用
  }

  const { count: totalBlocks } = await supabase.from(TABLES.BLOCKS).select("*", { count: "exact", head: true })

  const { count: pendingVerifications } = await supabase
    .from(TABLES.PROFILES)
    .select("*", { count: "exact", head: true })
    .is("is_verified", false)
    .not("id_verification_image_url", "is", null)

  const { count: newUsersToday } = await supabase
    .from(TABLES.PROFILES)
    .select("*", { count: "exact", head: true })
    .gte("created_at", last24Hours)

  const { count: newLikesToday } = await supabase
    .from(TABLES.LIKES)
    .select("*", { count: "exact", head: true })
    .gte("created_at", last24Hours)

  const { count: newMessagesToday } = await supabase
    .from(TABLES.MESSAGES)
    .select("*", { count: "exact", head: true })
    .gte("created_at", last24Hours)

  const { count: profileViewsToday } = await supabase
    .from(TABLES.PROFILE_VIEWS)
    .select("*", { count: "exact", head: true })
    .gte("viewed_at", last24Hours)

  let recentActivities: any[] = []
  try {
    const { data, error } = await supabase
      .from(TABLES.MODERATION_LOGS)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (!error && data) {
      // 別途ユーザー情報を取得
      const moderatorIds = [...new Set(data.map((d) => d.moderator_id).filter(Boolean))]
      const targetUserIds = [...new Set(data.map((d) => d.target_user_id).filter(Boolean))]
      const allUserIds = [...new Set([...moderatorIds, ...targetUserIds])]

      if (allUserIds.length > 0) {
        const { data: users } = await supabase.from(TABLES.PROFILES).select("id, nickname").in("id", allUserIds)

        const userMap = new Map(users?.map((u) => [u.id, u.nickname]) || [])

        recentActivities = data.map((activity) => ({
          ...activity,
          moderator: { nickname: userMap.get(activity.moderator_id) || "管理者" },
          target_user: { nickname: userMap.get(activity.target_user_id) || "ユーザー" },
        }))
      } else {
        recentActivities = data.map((activity) => ({
          ...activity,
          moderator: { nickname: "管理者" },
          target_user: { nickname: "ユーザー" },
        }))
      }
    }
  } catch (error) {
    // テーブルが存在しない場合は空配列を使用
  }

  const stats = [
    {
      title: "総ユーザー数",
      value: totalUsers || 0,
      change: `+${newUsersToday || 0} (24h)`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/admin/users",
    },
    {
      title: "有料会員数",
      value: premiumUsers || 0,
      change: `${totalUsers ? Math.round(((premiumUsers || 0) / totalUsers) * 100) : 0}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/admin/users?filter=premium",
    },
    {
      title: "本人確認待ち",
      value: pendingVerifications || 0,
      change: "要対応",
      icon: Shield,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/admin/verification",
    },
    {
      title: "未処理通報",
      value: pendingReports || 0,
      change: pendingReports && pendingReports > 0 ? "要対応" : "問題なし",
      icon: Flag,
      color: "text-red-600",
      bgColor: "bg-red-50",
      href:
        pendingReports && pendingReports > 0 ? "/admin/reports?status=pending" : "/admin/reports",
    },
    {
      title: "総マッチ数",
      value: totalMatches,
      change: `+${newMatchesToday} (24h)`,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/admin/statistics",
    },
    {
      title: "総ブロック数",
      value: totalBlocks || 0,
      change: "監視中",
      icon: Ban,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      href: "/admin/blocks",
    },
  ]

  const activityStats = [
    {
      title: "新規登録",
      value: newUsersToday || 0,
      icon: UserPlus,
      color: "text-blue-500",
    },
    {
      title: "いいね",
      value: newLikesToday || 0,
      icon: Heart,
      color: "text-pink-500",
    },
    {
      title: "マッチ",
      value: newMatchesToday || 0,
      icon: TrendingUp,
      color: "text-purple-500",
    },
    {
      title: "メッセージ",
      value: newMessagesToday || 0,
      icon: MessageSquare,
      color: "text-orange-500",
    },
    {
      title: "プロフィール閲覧",
      value: profileViewsToday || 0,
      icon: Eye,
      color: "text-cyan-500",
    },
  ]

  const actionLabels: Record<string, string> = {
    suspend: "ユーザー停止",
    unsuspend: "停止解除",
    ban: "BAN",
    unban: "BAN解除",
    delete_content: "コンテンツ削除",
    approve_verification: "本人確認承認",
    reject_verification: "本人確認却下",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">管理ダッシュボード</h1>
          <p className="text-gray-600">ささえ愛の運営管理</p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <AdminStatCardLink key={stat.title} href={stat.href}>
              <Card className="cursor-pointer p-6 transition-all hover:scale-105 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="mt-1 text-xs text-gray-500">{stat.change}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </AdminStatCardLink>
          ))}
        </div>

        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-xl font-semibold">過去24時間のアクティビティ</h2>
          <div className="grid gap-4 md:grid-cols-5">
            {activityStats.map((stat) => (
              <div key={stat.title} className="flex items-center gap-3 rounded-lg border p-4">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.title}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Shield className="h-5 w-5" />
              クイックアクション
            </h2>
            <div className="space-y-2">
              <Link href="/admin/users" className="block rounded-lg border p-4 transition-colors hover:bg-gray-50">
                <p className="font-medium">ユーザー管理</p>
                <p className="text-sm text-gray-600">ユーザーの検索・管理・停止</p>
              </Link>
              <Link href="/admin/reports" className="block rounded-lg border p-4 transition-colors hover:bg-gray-50">
                <p className="font-medium">通報管理</p>
                <p className="text-sm text-gray-600">通報内容の確認と対応</p>
              </Link>
              <Link href="/admin/blocks" className="block rounded-lg border p-4 transition-colors hover:bg-gray-50">
                <p className="font-medium">ブロック管理</p>
                <p className="text-sm text-gray-600">全ブロック関係の管理と監視</p>
              </Link>
              <Link href="/admin/coupons" className="block rounded-lg border p-4 transition-colors hover:bg-gray-50">
                <p className="font-medium">クーポン管理</p>
                <p className="text-sm text-gray-600">クーポンコードの作成と管理</p>
              </Link>
              <Link href="/admin/ads" className="block rounded-lg border p-4 transition-colors hover:bg-gray-50">
                <p className="font-medium">広告管理</p>
                <p className="text-sm text-gray-600">Amazon・楽天の広告設定</p>
              </Link>
              <Link
                href="/admin/verification"
                className="block rounded-lg border p-4 transition-colors hover:bg-gray-50"
              >
                <p className="font-medium">本人確認管理</p>
                <p className="text-sm text-gray-600">年齢確認書類の審査と承認</p>
              </Link>
              <Link href="/admin/statistics" className="block rounded-lg border p-4 transition-colors hover:bg-gray-50">
                <p className="font-medium">統計ダッシュボード</p>
                <p className="text-sm text-gray-600">詳細な統計情報とエンゲージメント分析</p>
              </Link>
              <Link href="/admin/email" className="block rounded-lg border p-4 transition-colors hover:bg-gray-50">
                <p className="font-medium">メール配信管理</p>
                <p className="text-sm text-gray-600">メール配信の統計と履歴</p>
              </Link>
              <Link href="/admin/email-logs" className="block rounded-lg border p-4 transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <p className="font-medium">メール送信ログ</p>
                </div>
                <p className="text-sm text-gray-600">送信履歴・配信状況・エラー確認</p>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">最近のモデレーション活動</h2>
            <div className="space-y-3 text-sm">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity: any) => (
                  <div key={activity.id} className="border-l-4 border-blue-500 bg-gray-50 p-3 rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{actionLabels[activity.action] || activity.action}</p>
                        <p className="text-gray-600">
                          <span className="font-medium">{activity.moderator?.nickname || "管理者"}</span>
                          {" → "}
                          <span className="font-medium">{activity.target_user?.nickname || "ユーザー"}</span>
                        </p>
                        {activity.reason && <p className="text-xs text-gray-500 mt-1">理由: {activity.reason}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.created_at).toLocaleString("ja-JP")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">最近のアクティビティはありません</p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
