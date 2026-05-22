import { notFound } from "next/navigation"
import { fetchAdminHeaderProfile, isValidReportId, verifyAdminAccess } from "@/lib/admin/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TABLES } from "@/lib/supabase/table-names"
import { ReportDetailView, type SasaeaiReportDetail } from "@/components/admin/report-detail-view"

async function fetchReportDetailForAdmin(reportId: string) {
  try {
    const service = createServiceRoleClient()
    const { data: reportRow, error } = await service
      .from(TABLES.REPORTS)
      .select("*")
      .eq("id", reportId)
      .maybeSingle()

    if (error || !reportRow) {
      return null
    }

    const relatedUserIds = [reportRow.reporter_id, reportRow.reported_user_id].filter(Boolean) as string[]
    let reporter: SasaeaiReportDetail["reporter"] = null
    let reportedUser: SasaeaiReportDetail["reported_user"] = null

    if (relatedUserIds.length > 0) {
      const { data: profileRows } = await service
        .from(TABLES.PROFILES)
        .select("id, user_id, nickname, email, profile_images, is_active, status")
        .in("id", relatedUserIds)

      reporter = profileRows?.find((p) => p.id === reportRow.reporter_id) ?? null
      reportedUser = profileRows?.find((p) => p.id === reportRow.reported_user_id) ?? null
    }

    const { data: logs } = await service
      .from(TABLES.MODERATION_LOGS)
      .select("*")
      .eq("target_report_id", reportId)
      .order("created_at", { ascending: false })

    return {
      report: {
        ...(reportRow as SasaeaiReportDetail),
        reporter,
        reported_user: reportedUser,
      },
      moderationLogs: logs ?? [],
    }
  } catch (e) {
    console.error("[admin/reports/[id]] service role fetch failed:", e)
    return null
  }
}

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const reportId = rawId?.trim()

  if (!isValidReportId(reportId)) {
    notFound()
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !(await verifyAdminAccess(user.id))) {
    notFound()
  }

  const profile = await fetchAdminHeaderProfile(user.id)
  const detail = await fetchReportDetailForAdmin(reportId)

  if (!detail) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />
      <main className="container mx-auto px-4 py-8">
        <ReportDetailView report={detail.report} moderationLogs={detail.moderationLogs} />
      </main>
    </div>
  )
}
