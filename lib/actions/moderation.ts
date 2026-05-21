"use server"

import { isSasaeaiAdmin } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { revalidatePath } from "next/cache"

export type ReportType = "harassment" | "spam" | "inappropriate" | "other"
export type ContextType = "group_chat" | "direct_message" | "profile"
export type BanType = "group_chat" | "messaging" | "platform"

// 通報を作成
export async function createReport(data: {
  reportedUserId: string
  reportType: ReportType
  reportReason: string
  contextType: ContextType
  contextId?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  const { error } = await supabase.from(TABLES.REPORTS).insert({
    reporter_id: user.id,
    reported_user_id: data.reportedUserId,
    report_type: data.reportType,
    report_reason: data.reportReason,
    context_type: data.contextType,
    context_id: data.contextId,
  })

  if (error) {
    console.error("[v0] Error creating report:", error)
    return { success: false, error: "通報の送信に失敗しました" }
  }

  return {
    success: true,
    message: "管理人に通知しました。確認までお待ちください。",
  }
}

// ユーザーをブロック
export async function blockUser(blockedUserId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  const { error } = await supabase.from(TABLES.BLOCKED_USERS).insert({
    blocker_id: user.id,
    blocked_user_id: blockedUserId,
  })

  if (error) {
    console.error("[v0] Error blocking user:", error)
    return { success: false, error: "ブロックに失敗しました" }
  }

  revalidatePath("/group-chat")
  return { success: true }
}

// ブロック解除
export async function unblockUser(blockedUserId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  const { error } = await supabase
    .from(TABLES.BLOCKED_USERS)
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_user_id", blockedUserId)

  if (error) {
    console.error("[v0] Error unblocking user:", error)
    return { success: false, error: "ブロック解除に失敗しました" }
  }

  revalidatePath("/group-chat")
  return { success: true }
}

// ブロックリストを取得
export async function getBlockedUsers() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "ログインが必要です", data: [] }
  }

  const { data, error } = await supabase
    .from(TABLES.BLOCKED_USERS)
    .select(
      `
      blocked_user_id,
      created_at,
      blocked_profile:sasaeai_profiles!sasaeai_blocked_users_blocked_user_id_fkey(
        user_id,
        nickname,
        profile_images
      )
    `,
    )
    .eq("blocker_id", user.id)

  if (error) {
    console.error("[v0] Error fetching blocked users:", error)
    return { success: false, error: "ブロックリストの取得に失敗しました", data: [] }
  }

  return { success: true, data: data || [] }
}

// ユーザーがブロックされているかチェック
export async function isUserBlocked(userId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from(TABLES.BLOCKED_USERS)
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_user_id", userId)
    .single()

  return !error && !!data
}

// 管理者：通報一覧を取得
export async function getReports(status?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "ログインが必要です", data: [] }
  }

  // 管理者チェック
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!isSasaeaiAdmin(profile)) {
    return { success: false, error: "管理者権限が必要です", data: [] }
  }

  const statusFilter = typeof status === "string" ? status.trim() || undefined : undefined

  const embedSelect = `
      *,
      reporter:sasaeai_profiles!sasaeai_reports_reporter_id_fkey(user_id, nickname, profile_images),
      reported_user:sasaeai_profiles!sasaeai_reports_reported_user_id_fkey(user_id, nickname, profile_images)
    `

  let query = supabase.from(TABLES.REPORTS).select(embedSelect)
  if (statusFilter) {
    query = query.eq("status", statusFilter)
  }

  const { data: withEmbeds, error: embedError } = await query.order("created_at", { ascending: false })

  if (embedError) {
    console.warn("[getReports] embed select failed, retry without join:", embedError.message)
    let q2 = supabase.from(TABLES.REPORTS).select("*")
    if (statusFilter) {
      q2 = q2.eq("status", statusFilter)
    }
    const { data: rows, error: err2 } = await q2.order("created_at", { ascending: false })
    if (err2) {
      console.error("[v0] Error fetching reports:", err2)
      return { success: false, error: "通報一覧の取得に失敗しました", data: [] }
    }
    return { success: true, data: rows || [] }
  }

  return { success: true, data: withEmbeds || [] }
}

// 管理者：通報ステータス更新
export async function updateReportStatus(
  reportId: string,
  status: "reviewed" | "action_taken" | "dismissed",
  adminNotes?: string,
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  // 管理者チェック
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!isSasaeaiAdmin(profile)) {
    return { success: false, error: "管理者権限が必要です" }
  }

  const { error } = await supabase
    .from(TABLES.REPORTS)
    .update({
      status,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId)

  if (error) {
    console.error("[v0] Error updating report:", error)
    return { success: false, error: "通報ステータスの更新に失敗しました" }
  }

  // 一覧の revalidate は詳細ページ滞在中にルーターが一覧へ戻る原因になるため、詳細のみ無効化する
  revalidatePath(`/admin/reports/${reportId}`, "page")
  return { success: true }
}

// 管理者：ユーザーをBANする
export async function banUser(data: {
  userId: string
  banType: BanType
  banReason: string
  banExpiresAt?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  // 管理者チェック
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!isSasaeaiAdmin(profile)) {
    return { success: false, error: "管理者権限が必要です" }
  }

  const { error } = await supabase.from(TABLES.BANS).insert({
    user_id: data.userId,
    banned_by: user.id,
    ban_type: data.banType,
    ban_reason: data.banReason,
    ban_expires_at: data.banExpiresAt || null,
  })

  if (error) {
    console.error("[v0] Error banning user:", error)
    return { success: false, error: "BANに失敗しました" }
  }

  revalidatePath("/admin/reports")
  revalidatePath("/group-chat")
  return { success: true }
}

// 管理者：BAN解除
export async function unbanUser(banId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  // 管理者チェック
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!isSasaeaiAdmin(profile)) {
    return { success: false, error: "管理者権限が必要です" }
  }

  const { error } = await supabase.from(TABLES.BANS).delete().eq("id", banId)

  if (error) {
    console.error("[v0] Error unbanning user:", error)
    return { success: false, error: "BAN解除に失敗しました" }
  }

  revalidatePath("/admin/reports")
  revalidatePath("/group-chat")
  return { success: true }
}

/** 管理者：対象ユーザーをプラットフォームブロック（status=blocked + is_active=false） */
export async function adminBlockUser(userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }
  if (user.id === userId) {
    return { success: false, error: "自分自身をブロックできません" }
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()
  if (!isSasaeaiAdmin(profile)) {
    return { success: false, error: "管理者権限が必要です" }
  }

  const { error } = await supabase
    .from(TABLES.PROFILES)
    .update({
      status: "blocked",
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("[adminBlockUser]", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
  revalidatePath("/admin/reports")
  return { success: true }
}

/** 管理者：ブロック解除（status=active + is_active=true） */
export async function adminUnblockUser(userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "ログインが必要です" }
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()
  if (!isSasaeaiAdmin(profile)) {
    return { success: false, error: "管理者権限が必要です" }
  }

  const { error } = await supabase
    .from(TABLES.PROFILES)
    .update({
      status: "active",
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("[adminUnblockUser]", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/users")
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}
