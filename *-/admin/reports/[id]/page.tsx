"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { TABLES } from "@/lib/supabase/table-names"
import { Alert } from "@/components/ui/alert"
import { ReportDetailView, type SasaeaiReportDetail } from "@/components/admin/report-detail-view"

export default function AdminReportDetailPage() {
  const params = useParams<{ id?: string | string[] }>()
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const [headerProfile, setHeaderProfile] = useState<any>(null)
  const [report, setReport] = useState<SasaeaiReportDetail | null>(null)
  const [moderationLogs, setModerationLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError("通報IDがありません")
      setLoading(false)
      return
    }

    let alive = true
    setLoading(true)
    setError(null)

    void (async () => {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (alive) {
          setError("ログインが必要です")
          setLoading(false)
        }
        return
      }

      const [{ data: profile }, { data: reportRow, error: reportError }, { data: logs }] = await Promise.all([
        supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).maybeSingle(),
        supabase.from(TABLES.REPORTS).select("*").eq("id", id).maybeSingle(),
        supabase.from(TABLES.MODERATION_LOGS).select("*").eq("target_report_id", id).order("created_at", { ascending: false }),
      ])

      if (!alive) return

      setHeaderProfile(profile ?? null)
      setModerationLogs(logs ?? [])

      if (reportError || !reportRow) {
        setError(reportError?.message ?? "通報詳細の取得に失敗しました")
        setReport(null)
      } else {
        const relatedUserIds = [reportRow.reporter_id, reportRow.reported_user_id].filter(Boolean) as string[]
        let reporter: any = null
        let reportedUser: any = null

        if (relatedUserIds.length > 0) {
          const { data: profileRows } = await supabase
            .from(TABLES.PROFILES)
            .select("id, user_id, nickname, email, profile_images, is_active, status")
            .in("id", relatedUserIds)

          reporter = profileRows?.find((p: { id: string }) => p.id === reportRow.reporter_id) ?? null
          reportedUser = profileRows?.find((p: { id: string }) => p.id === reportRow.reported_user_id) ?? null
        }

        setReport({
          ...(reportRow as SasaeaiReportDetail),
          reporter,
          reported_user: reportedUser,
        })
      }

      setLoading(false)
    })()

    return () => {
      alive = false
    }
  }, [id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={headerProfile} />
      <main className="container mx-auto px-4 py-8">
        {loading ? <div>読み込み中...</div> : null}
        {!loading && error ? <Alert variant="destructive">{error}</Alert> : null}
        {!loading && !error && report ? <ReportDetailView report={report} moderationLogs={moderationLogs} /> : null}
      </main>
    </div>
  )
}
