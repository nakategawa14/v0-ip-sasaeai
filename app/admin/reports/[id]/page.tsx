import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ReportDetailView } from "@/components/admin/report-detail-view"
import { TABLES } from "@/lib/supabase/table-names"

export default async function AdminReportDetailPage({ params }: { params: { id: string } }) {
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

  const { data: report } = await supabase
    .from(TABLES.REPORTS)
    .select(
      `
      *,
      reporter:reporter_id(id, display_name, email, avatar_url),
      reported:reported_id(id, display_name, email, avatar_url, is_active)
    `,
    )
    .eq("id", params.id)
    .single()

  if (!report) {
    redirect("/admin/reports")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <ReportDetailView report={report} />
      </main>
    </div>
  )
}
