import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { fetchAdminHeaderProfile } from "@/lib/admin/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TABLES } from "@/lib/supabase/table-names"
import { ReportList } from "@/components/admin/report-list"

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 認可は app/admin/layout.tsx で実施。ここではヘッダー表示用プロフィールのみ取得する。
  const profile = user ? await fetchAdminHeaderProfile(user.id) : null

  const rawStatus = sp.status
  const statusFilter =
    typeof rawStatus === "string"
      ? rawStatus.trim() || undefined
      : Array.isArray(rawStatus) && rawStatus.length > 0
        ? String(rawStatus[0]).trim() || undefined
        : undefined

  const reportEmbedSelect = `
      *,
      reporter:sasaeai_profiles!sasaeai_reports_reporter_id_fkey(id, nickname, profile_images),
      reported_user:sasaeai_profiles!sasaeai_reports_reported_user_id_fkey(id, nickname, profile_images)
    `

  let listQuery = supabase.from(TABLES.REPORTS).select(reportEmbedSelect)
  if (statusFilter) {
    listQuery = listQuery.eq("status", statusFilter)
  }

  const { data: reportsWithEmbeds, error: embedError } = await listQuery.order("created_at", { ascending: false })

  let reports: any[] = reportsWithEmbeds ?? []
  if (embedError) {
    console.warn("[admin/reports] embed select failed, retrying without join:", embedError.message)
    let fallbackQuery = supabase.from(TABLES.REPORTS).select("*")
    if (statusFilter) {
      fallbackQuery = fallbackQuery.eq("status", statusFilter)
    }
    const { data: fallbackRows, error: fallbackError } = await fallbackQuery.order("created_at", { ascending: false })
    if (fallbackError) {
      console.error("[admin/reports] fallback select failed:", fallbackError.message)
      reports = []
    } else {
      const baseRows = fallbackRows ?? []
      const userIds = Array.from(
        new Set(baseRows.flatMap((r) => [r.reporter_id, r.reported_user_id]).filter(Boolean)),
      ) as string[]

      if (userIds.length === 0) {
        reports = baseRows
      } else {
        const { data: profiles } = await supabase
          .from(TABLES.PROFILES)
          .select("id, nickname, profile_images")
          .in("id", userIds)

        const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
        reports = baseRows.map((r) => ({
          ...r,
          reporter: profileMap.get(r.reporter_id) ?? null,
          reported_user: profileMap.get(r.reported_user_id) ?? null,
        }))
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">通報管理</h1>
          <p className="text-gray-600">ユーザーからの通報内容を確認・対応できます</p>
        </div>

        <Suspense fallback={<div className="text-sm text-gray-600">通報一覧を読み込み中…</div>}>
          <ReportList reports={reports} currentStatus={statusFilter} />
        </Suspense>
      </main>
    </div>
  )
}
