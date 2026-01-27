import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TABLES } from "@/lib/supabase/table-names"
import { ReportList } from "@/components/admin/report-list"

export default async function AdminReportsPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("user_id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  let query = supabase.from(TABLES.REPORTS).select(
    `
      *,
      reporter:sasaeai_profiles!sasaeai_reports_reporter_id_fkey(user_id, nickname, profile_images),
      reported_user:sasaeai_profiles!sasaeai_reports_reported_user_id_fkey(user_id, nickname, profile_images)
    `,
  )

  if (searchParams.status) {
    query = query.eq("status", searchParams.status)
  }

  const { data: reports } = await query.order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">通報管理</h1>
          <p className="text-gray-600">ユーザーからの通報内容を確認・対応できます</p>
        </div>

        <ReportList reports={reports || []} currentStatus={searchParams.status} />
      </main>
    </div>
  )
}
