"use server"

import { createClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"

export type ModerationActionType =
  | "warning_issued"
  | "user_banned"
  | "user_unbanned"
  | "report_resolved"
  | "report_dismissed"
  | "user_suspended"
  | "user_unsuspended"
  | "content_removed"
  | "verification_approved"
  | "verification_rejected"
  | "admin_official_dm"
  | "admin_warning_email"
  | "user_forced_deactivation"

interface LogModerationActionParams {
  actionType: ModerationActionType
  targetUserId?: string
  targetReportId?: string
  details?: Record<string, unknown>
  notes?: string
}

export async function createModerationLog(params: LogModerationActionParams) {
  return logModerationAction(params)
}

// モデレーションアクションをログに記録
export async function logModerationAction({
  actionType,
  targetUserId,
  targetReportId,
  details,
  notes,
}: LogModerationActionParams) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "認証が必要です" }
  }

  const { error } = await supabase.from(TABLES.MODERATION_LOGS).insert({
    admin_id: user.id,
    action_type: actionType,
    target_user_id: targetUserId || null,
    target_report_id: targetReportId || null,
    details: details || null,
    notes: notes || null,
  })

  if (error) {
    console.error("モデレーションログ記録エラー:", error)
    return { error: "ログの記録に失敗しました" }
  }

  return { success: true }
}

// モデレーションログ一覧を取得
export async function getModerationLogs(options?: {
  limit?: number
  offset?: number
  actionType?: ModerationActionType
  adminId?: string
  targetUserId?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { logs: [], total: 0, error: "認証が必要です" }
  }

  // 管理者権限チェック
  const { data: adminProfile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!adminProfile?.is_admin) {
    return { logs: [], total: 0, error: "管理者権限が必要です" }
  }

  let query = supabase.from(TABLES.MODERATION_LOGS).select("*", { count: "exact" })

  if (options?.actionType) {
    query = query.eq("action_type", options.actionType)
  }
  if (options?.adminId) {
    query = query.eq("admin_id", options.adminId)
  }
  if (options?.targetUserId) {
    query = query.eq("target_user_id", options.targetUserId)
  }

  query = query.order("created_at", { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }

  const { data: logs, error, count } = await query

  if (error) {
    console.error("モデレーションログ取得エラー:", error)
    return { logs: [], total: 0, error: "ログの取得に失敗しました" }
  }

  // 管理者とターゲットユーザーの情報を別途取得
  const adminIds = [...new Set(logs?.map((l) => l.admin_id) || [])]
  const targetUserIds = [...new Set(logs?.map((l) => l.target_user_id).filter(Boolean) || [])]

  const { data: admins } = await supabase.from(TABLES.PROFILES).select("id, nickname").in("id", adminIds)

  const { data: targetUsers } = await supabase.from(TABLES.PROFILES).select("id, nickname").in("id", targetUserIds)

  const adminMap = new Map(admins?.map((a) => [a.id, a.nickname]) || [])
  const targetUserMap = new Map(targetUsers?.map((u) => [u.id, u.nickname]) || [])

  const logsWithNames = logs?.map((log) => ({
    ...log,
    admin_nickname: adminMap.get(log.admin_id) || "不明",
    target_user_nickname: log.target_user_id ? targetUserMap.get(log.target_user_id) || "不明" : null,
  }))

  return { logs: logsWithNames || [], total: count || 0, error: null }
}

/** 特定の通報に紐づくモデレーションログ（運営操作パネルの履歴用） */
export async function getModerationLogsForReport(reportId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { logs: [], error: "認証が必要です" }
  }

  const { data: adminProfile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!adminProfile?.is_admin) {
    return { logs: [], error: "管理者権限が必要です" }
  }

  const { data: logs, error } = await supabase
    .from(TABLES.MODERATION_LOGS)
    .select("*")
    .eq("target_report_id", reportId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("getModerationLogsForReport", error)
    return { logs: [], error: "ログの取得に失敗しました" }
  }

  const adminIds = [...new Set(logs?.map((l) => l.admin_id) || [])]
  const { data: admins } = await supabase.from(TABLES.PROFILES).select("id, nickname").in("id", adminIds)
  const adminMap = new Map(admins?.map((a) => [a.id, a.nickname]) || [])

  const withNames = logs?.map((log) => ({
    ...log,
    admin_nickname: adminMap.get(log.admin_id) || "不明",
  }))

  return { logs: withNames || [], error: null }
}

// アクションタイプの日本語ラベル
export async function getActionTypeLabel(actionType: ModerationActionType): Promise<string> {
  const labels: Record<ModerationActionType, string> = {
    warning_issued: "警告を発行",
    user_banned: "ユーザーをBAN",
    user_unbanned: "BANを解除",
    report_resolved: "通報を解決",
    report_dismissed: "通報を却下",
    user_suspended: "ユーザーを一時停止",
    user_unsuspended: "一時停止を解除",
    content_removed: "コンテンツを削除",
    verification_approved: "本人確認を承認",
    verification_rejected: "本人確認を却下",
    admin_official_dm: "運営公式メッセージ送信",
    admin_warning_email: "注意喚起メール送信",
    user_forced_deactivation: "強制退会",
  }
  return labels[actionType] || actionType
}
