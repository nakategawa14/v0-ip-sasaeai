import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Bell, Eye, Heart, MessageCircle, UserCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

export const metadata = {
  title: "通知管理 - 管理画面",
  description: "通知の管理",
}

const notificationIcons = {
  profile_view: Eye,
  like_received: Heart,
  match: UserCheck,
  message: MessageCircle,
}

const notificationTypeLabels = {
  profile_view: "プロフィール訪問",
  like_received: "いいね受信",
  match: "マッチング成立",
  message: "メッセージ受信",
}

async function getNotificationsData() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // 管理者チェック
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("user_id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/")
  }

  // 通知の統計
  const { count: totalCount } = await supabase.from(TABLES.NOTIFICATIONS).select("*", { count: "exact", head: true })

  const { count: unreadCount } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .select("*", { count: "exact", head: true })
    .eq("is_read", false)

  const { data: typeStats } = await supabase.from(TABLES.NOTIFICATIONS).select("type")

  const typeCountMap = typeStats?.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // 最近の通知
  const { data: recentNotifications } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .select(
      `
      *,
      user_profile:sasaeai_profiles!sasaeai_notifications_user_id_fkey(nickname, display_name),
      related_profile:sasaeai_profiles!sasaeai_notifications_related_user_id_fkey(nickname, display_name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50)

  return {
    totalCount: totalCount || 0,
    unreadCount: unreadCount || 0,
    typeCountMap: typeCountMap || {},
    recentNotifications: recentNotifications || [],
  }
}

export default async function AdminNotificationsPage() {
  const { totalCount, unreadCount, typeCountMap, recentNotifications } = await getNotificationsData()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">通知管理</h1>
            <p className="text-gray-600">システム内の通知を確認・管理します</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              管理画面に戻る
            </Link>
          </Button>
        </div>

        {/* 統計カード */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">総通知数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">未読通知数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{unreadCount}</div>
            </CardContent>
          </Card>

          {Object.entries(notificationTypeLabels).map(([type, label]) => (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{typeCountMap[type] || 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 最近の通知一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>最近の通知</CardTitle>
            <CardDescription>最新50件の通知を表示しています</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              }
            >
              {recentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Bell className="mb-4 h-12 w-12 text-gray-400" />
                  <p>通知はありません</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentNotifications.map((notification: any) => {
                    const Icon = notificationIcons[notification.type as keyof typeof notificationIcons]
                    const relativeTime = formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ja,
                    })

                    return (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 rounded-lg border p-4 ${
                          !notification.is_read ? "border-l-4 border-l-blue-500 bg-blue-50" : "bg-white"
                        }`}
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>

                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant="outline">
                              {notificationTypeLabels[notification.type as keyof typeof notificationTypeLabels]}
                            </Badge>
                            {!notification.is_read && <Badge variant="default">未読</Badge>}
                          </div>
                          <p className="text-sm">
                            <span className="font-semibold">
                              {notification.user_profile?.display_name || notification.user_profile?.nickname || "不明"}
                            </span>{" "}
                            - {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">{relativeTime}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
