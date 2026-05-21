"use server"

import { createClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { revalidatePath } from "next/cache"
import { logModerationAction } from "./moderation-logs"

export type WarningSeverity = "warning" | "serious_warning" | "final_warning"

interface IssueWarningParams {
  userId: string
  reason: string
  severity: WarningSeverity
  relatedReportId?: string
  notes?: string
}

// 警告を発行
export async function issueWarning({ userId, reason, severity, relatedReportId, notes }: IssueWarningParams) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "認証が必要です" }
  }

  // 管理者権限チェック
  const { data: adminProfile } = await supabase
    .from(TABLES.PROFILES)
    .select("is_admin, nickname")
    .eq("id", user.id)
    .single()

  if (!adminProfile || adminProfile.is_admin !== true) {
    return { error: "管理者権限が必要です" }
  }

  // 対象ユーザーの情報を取得
  const { data: targetUser } = await supabase.from(TABLES.PROFILES).select("nickname, email").eq("id", userId).single()

  if (!targetUser) {
    return { error: "対象ユーザーが見つかりません" }
  }

  // 警告を作成
  const { data: warning, error } = await supabase
    .from("sasaeai_warnings")
    .insert({
      user_id: userId,
      admin_id: user.id,
      reason,
      severity,
      related_report_id: relatedReportId || null,
    })
    .select()
    .single()

  if (error) {
    console.error("警告作成エラー:", error)
    return { error: "警告の作成に失敗しました" }
  }

  // モデレーションログを記録
  await logModerationAction({
    actionType: "warning_issued",
    targetUserId: userId,
    targetReportId: relatedReportId,
    details: {
      severity,
      reason,
      warning_id: warning.id,
    },
    notes,
  })

  // ユーザーへの通知を作成
  const severityLabel = {
    warning: "警告",
    serious_warning: "重大な警告",
    final_warning: "最終警告",
  }[severity]

  await supabase.from(TABLES.NOTIFICATIONS).insert({
    user_id: userId,
    type: "warning",
    title: `${severityLabel}を受けました`,
    message: reason,
    data: { warning_id: warning.id, severity },
  })

  // 警告回数をチェックして自動BANの判定
  const { data: warningCount } = await supabase.from("sasaeai_warnings").select("id, severity").eq("user_id", userId)

  const finalWarnings = warningCount?.filter((w) => w.severity === "final_warning").length || 0
  const totalWarnings = warningCount?.length || 0

  // 最終警告が1回以上、または警告が3回以上で自動BAN推奨
  const shouldRecommendBan = finalWarnings >= 1 || totalWarnings >= 3

  revalidatePath("/admin/reports")
  revalidatePath("/admin/moderation-logs")

  return {
    success: true,
    warning,
    shouldRecommendBan,
    totalWarnings,
    finalWarnings,
  }
}

// ユーザーの警告履歴を取得
export async function getUserWarnings(userId: string) {
  const supabase = await createClient()

  const { data: warnings, error } = await supabase
    .from("sasaeai_warnings")
    .select(`
      id,
      reason,
      severity,
      acknowledged_at,
      created_at,
      related_report_id
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("警告取得エラー:", error)
    return { warnings: [], error: "警告履歴の取得に失敗しました" }
  }

  // 管理者情報を別途取得
  const adminIds = [...new Set(warnings?.map((w) => w.id) || [])]

  return { warnings: warnings || [], error: null }
}

// 警告の確認（ユーザーが警告を読んだことを記録）
export async function acknowledgeWarning(warningId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "認証が必要です" }
  }

  const { error } = await supabase
    .from("sasaeai_warnings")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("id", warningId)
    .eq("user_id", user.id)

  if (error) {
    return { error: "警告の確認に失敗しました" }
  }

  revalidatePath("/notifications")
  return { success: true }
}

// 警告統計を取得
export async function getWarningStats(userId: string) {
  const supabase = await createClient()

  const { data: warnings } = await supabase.from("sasaeai_warnings").select("severity").eq("user_id", userId)

  if (!warnings) {
    return {
      total: 0,
      warning: 0,
      serious_warning: 0,
      final_warning: 0,
    }
  }

  return {
    total: warnings.length,
    warning: warnings.filter((w) => w.severity === "warning").length,
    serious_warning: warnings.filter((w) => w.severity === "serious_warning").length,
    final_warning: warnings.filter((w) => w.severity === "final_warning").length,
  }
}
