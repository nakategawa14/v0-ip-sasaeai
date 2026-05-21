"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"

export type ReportType = "inappropriate_profile" | "harassment" | "scam" | "fake_profile" | "spam" | "other"

export async function reportUser(reportedUserId: string, reportType: ReportType, description: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

  if (user.id === reportedUserId) {
    return { error: "自分自身を報告することはできません" }
  }

  if (!description || description.trim().length < 10) {
    return { error: "詳細は10文字以上入力してください" }
  }

  const { error } = await supabase.from(TABLES.REPORTS).insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    report_type: reportType,
    description: description.trim(),
    status: "pending",
  })

  if (error) {
    console.error("[v0] Error reporting user:", error)
    return { error: "報告の送信に失敗しました" }
  }

  revalidatePath(`/profile/${reportedUserId}`)
  revalidatePath("/admin/reports")

  return { success: true, message: "管理人に通知しました。確認までお待ちください。" }
}

export async function getMyReports() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です", reports: [] }
  }

  const { data, error } = await supabase
    .from(TABLES.REPORTS)
    .select(
      `
      *,
      reported_user:sasaeai_profiles!reported_user_id(user_id, nickname, avatar_url)
    `,
    )
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching reports:", error)
    return { error: "報告の取得に失敗しました", reports: [] }
  }

  return { success: true, reports: data || [] }
}

export async function updateReportStatus(
  reportId: string,
  status: "pending" | "reviewing" | "resolved" | "rejected",
  adminNotes?: string,
) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です" }
  }

  const { data: adminProfile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).maybeSingle()
  if (!adminProfile || adminProfile.is_admin !== true) {
    return { error: "管理者権限が必要です" }
  }

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (adminNotes) {
    updateData.admin_notes = adminNotes
  }

  if (status === "resolved" || status === "rejected") {
    updateData.resolved_at = new Date().toISOString()
    updateData.resolved_by = user.id
  }

  const { error } = await supabase.from(TABLES.REPORTS).update(updateData).eq("id", reportId)

  if (error) {
    console.error("[v0] Error updating report status:", error)
    return { error: "報告の更新に失敗しました" }
  }

  revalidatePath("/admin/reports")

  return { success: true }
}

export async function getAllReports() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "認証が必要です", reports: [] }
  }

  const { data: adminProfile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).maybeSingle()
  if (!adminProfile || adminProfile.is_admin !== true) {
    return { error: "管理者権限が必要です", reports: [] }
  }

  const { data, error } = await supabase
    .from(TABLES.REPORTS)
    .select(
      `
      *,
      reporter:sasaeai_profiles!reporter_id(user_id, nickname, email),
      reported_user:sasaeai_profiles!reported_user_id(user_id, nickname, email)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching all reports:", error)
    return { error: "報告の取得に失敗しました", reports: [] }
  }

  return { success: true, reports: data || [] }
}
