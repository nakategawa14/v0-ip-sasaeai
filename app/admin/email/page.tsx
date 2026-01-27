import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { TABLES } from "@/lib/supabase/table-names"
import { Mail, Send, CheckCircle, XCircle } from "lucide-react"

export default async function EmailManagementPage() {
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

  // メール配信統計
  const { count: totalEmails } = await supabase.from(TABLES.EMAIL_LOGS).select("*", { count: "exact", head: true })

  const { count: sentEmails } = await supabase
    .from(TABLES.EMAIL_LOGS)
    .select("*", { count: "exact", head: true })
    .eq("status", "sent")

  const { count: failedEmails } = await supabase
    .from(TABLES.EMAIL_LOGS)
    .select("*", { count: "exact", head: true })
    .eq("status", "failed")

  // メールタイプ別の統計
  const { count: profileVisitorEmails } = await supabase
    .from(TABLES.EMAIL_LOGS)
    .select("*", { count: "exact", head: true })
    .eq("email_type", "profile_visitors")

  const { count: matchNotificationEmails } = await supabase
    .from(TABLES.EMAIL_LOGS)
    .select("*", { count: "exact", head: true })
    .eq("email_type", "match_notification")

  const { count: weeklyDigestEmails } = await supabase
    .from(TABLES.EMAIL_LOGS)
    .select("*", { count: "exact", head: true })
    .eq("email_type", "weekly_digest")

  // 最近のメール配信履歴
  const { data: recentEmails } = await supabase
    .from(TABLES.EMAIL_LOGS)
    .select(
      `
      id,
      email_type,
      subject,
      sent_at,
      status,
      user:user_id (
        sasaeai_profiles (
          nickname
        )
      )
    `,
    )
    .order("sent_at", { ascending: false })
    .limit(10)

  const stats = [
    {
      title: "総配信数",
      value: totalEmails || 0,
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "配信成功",
      value: sentEmails || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "配信失敗",
      value: failedEmails || 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "プロフィール訪問通知",
      value: profileVisitorEmails || 0,
      icon: Send,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "マッチ通知",
      value: matchNotificationEmails || 0,
      icon: Send,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "週次ダイジェスト",
      value: weeklyDigestEmails || 0,
      icon: Send,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  const emailTypeLabels: Record<string, string> = {
    profile_visitors: "プロフィール訪問通知",
    match_notification: "マッチ通知",
    weekly_digest: "週次ダイジェスト",
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    sent: { label: "送信成功", color: "text-green-600" },
    failed: { label: "送信失敗", color: "text-red-600" },
    bounced: { label: "バウンス", color: "text-orange-600" },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">メール配信管理</h1>
            <p className="text-gray-600">メール配信の統計と履歴</p>
          </div>
          <a
            href="/admin/email/send"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
            メール送信
          </a>
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">配信成功率</h2>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>全体の配信成功率</span>
                  <span className="font-medium">
                    {totalEmails ? Math.round(((sentEmails || 0) / totalEmails) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{
                      width: `${totalEmails ? Math.round(((sentEmails || 0) / totalEmails) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">最近の配信履歴</h2>
            <div className="space-y-3">
              {recentEmails && recentEmails.length > 0 ? (
                recentEmails.map((email: any) => (
                  <div key={email.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{email.subject}</p>
                        <p className="text-sm text-gray-600">{emailTypeLabels[email.email_type] || email.email_type}</p>
                        <p className="text-xs text-gray-500">{new Date(email.sent_at).toLocaleString("ja-JP")}</p>
                      </div>
                      <span className={`text-sm font-medium ${statusLabels[email.status]?.color || "text-gray-600"}`}>
                        {statusLabels[email.status]?.label || email.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">配信履歴がありません</p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
