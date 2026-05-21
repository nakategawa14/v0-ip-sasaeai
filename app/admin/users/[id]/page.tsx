import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AdminUserActions } from "@/components/admin/admin-user-actions"
import { ProfileView } from "@/components/profile/profile-view"
import { TABLES } from "@/lib/supabase/table-names"
import { UserEditForm } from "@/components/admin/user-edit-form"

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  if (!profile || !["admin", "moderator"].includes(profile.user_type)) {
    redirect("/dashboard")
  }

  const { data: targetUser } = await supabase.from(TABLES.PROFILES).select("*").eq("id", id).single()

  if (!targetUser) {
    redirect("/admin/users")
  }

  // ユーザーの統計情報を取得
  const { count: sentLikes } = await supabase
    .from(TABLES.LIKES)
    .select("*", { count: "exact", head: true })
    .eq("from_user_id", id)

  const { count: receivedLikes } = await supabase
    .from(TABLES.LIKES)
    .select("*", { count: "exact", head: true })
    .eq("to_user_id", id)

  let matches = 0
  try {
    const result = await supabase
      .from(TABLES.MATCHES)
      .select("*", { count: "exact", head: true })
      .or(`user1_id.eq.${id},user2_id.eq.${id}`)
    matches = result.count || 0
  } catch (error) {
    console.error("[v0] Error fetching matches:", error)
  }

  const { count: messages } = await supabase
    .from(TABLES.MESSAGES)
    .select("*", { count: "exact", head: true })
    .eq("sender_id", id)

  const { data: payments } = await supabase
    .from(TABLES.SUBSCRIPTIONS)
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })

  const { data: reports } = await supabase
    .from(TABLES.REPORTS)
    .select("*")
    .eq("reported_id", id)
    .order("created_at", { ascending: false })

  let suspensions = null
  try {
    const result = await supabase
      .from("sasaeai_suspension_history")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
    suspensions = result.data
  } catch (error) {
    console.error("[v0] Error fetching suspensions:", error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ユーザー詳細</h1>
          <p className="text-gray-600">{targetUser.display_name}さんの情報</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProfileView profile={targetUser} isAdmin />

            <div className="mt-6">
              <UserEditForm user={targetUser} />
            </div>

            <Card className="mt-6 p-6">
              <h2 className="mb-4 text-xl font-semibold">通報履歴</h2>
              {reports && reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge
                          variant={
                            report.status === "resolved"
                              ? "default"
                              : report.status === "pending"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {report.status === "pending" ? "未対応" : report.status === "resolved" ? "解決済み" : "却下"}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(report.created_at).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{report.reason}</p>
                      {report.details && <p className="mt-1 text-sm text-gray-600">{report.details}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">通報履歴はありません</p>
              )}
            </Card>

            <Card className="mt-6 p-6">
              <h2 className="mb-4 text-xl font-semibold">停止履歴</h2>
              {suspensions && suspensions.length > 0 ? (
                <div className="space-y-4">
                  {suspensions.map((suspension) => (
                    <div key={suspension.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge variant={suspension.is_active ? "destructive" : "secondary"}>
                          {suspension.is_active ? "停止中" : "解除済み"}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(suspension.created_at).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{suspension.reason}</p>
                      {suspension.details && <p className="mt-1 text-sm text-gray-600">{suspension.details}</p>}
                      {suspension.suspension_type === "temporary" && suspension.suspended_until && (
                        <p className="mt-2 text-sm text-gray-600">
                          停止期限: {new Date(suspension.suspended_until).toLocaleDateString("ja-JP")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">停止履歴はありません</p>
              )}
            </Card>
          </div>

          <div>
            <AdminUserActions user={targetUser} />

            <Card className="mt-6 p-6">
              <h2 className="mb-4 text-xl font-semibold">アクティビティ</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">送ったいいね</span>
                  <span className="font-semibold">{sentLikes || 0}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">受け取ったいいね</span>
                  <span className="font-semibold">{receivedLikes || 0}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">マッチング数</span>
                  <span className="font-semibold">{matches || 0}件</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">送信メッセージ</span>
                  <span className="font-semibold">{messages || 0}件</span>
                </div>
              </div>
            </Card>

            <Card className="mt-6 p-6">
              <h2 className="mb-4 text-xl font-semibold">決済履歴</h2>
              {payments && payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="rounded-lg border p-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">¥{payment.amount.toLocaleString()}</span>
                        <Badge
                          variant={
                            payment.payment_status === "completed"
                              ? "default"
                              : payment.payment_status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {payment.payment_status === "completed"
                            ? "完了"
                            : payment.payment_status === "failed"
                              ? "失敗"
                              : "保留中"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">決済履歴はありません</p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
