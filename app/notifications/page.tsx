import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { NotificationList } from "@/components/notifications/notification-list"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "通知 - ささえ愛",
  description: "通知一覧",
}

async function getNotifications() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.nickname) {
    redirect("/profile/setup")
  }

  const { data: notifications, error: notificationsError } = await supabase
    .from(TABLES.NOTIFICATIONS)
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  if (notificationsError) {
    console.error("通知取得エラー:", notificationsError)
  }

  // 関連ユーザーのプロフィールを別クエリで取得
  const relatedUserIds = notifications?.filter((n) => n.related_user_id).map((n) => n.related_user_id) || []

  let profilesMap: Record<string, any> = {}
  if (relatedUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from(TABLES.PROFILES)
      .select("id, nickname, display_name, profile_image_url")
      .in("id", relatedUserIds)

    if (profiles) {
      profilesMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {})
    }
  }

  // 通知に関連プロフィールを追加
  const notificationsWithProfiles =
    notifications?.map((n) => ({
      ...n,
      related_profile: n.related_user_id ? profilesMap[n.related_user_id] : undefined,
    })) || []

  return {
    profile,
    notifications: notificationsWithProfiles,
  }
}

export default async function NotificationsPage() {
  const { profile, notifications } = await getNotifications()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">通知</h1>

        <Suspense
          fallback={
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          }
        >
          <NotificationList notifications={notifications} />
        </Suspense>
      </main>
    </div>
  )
}
