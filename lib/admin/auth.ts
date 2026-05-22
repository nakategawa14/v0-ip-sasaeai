import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { TABLES } from "@/lib/supabase/table-names"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** sasaeai_profiles.is_admin === true のみ管理者 */
export function isSasaeaiAdmin(profile: { is_admin?: boolean | null } | null | undefined): boolean {
  return profile?.is_admin === true
}

/** 通報詳細など admin 配下ナビ用の UUID 検証 */
export function isValidReportId(id: string | null | undefined): id is string {
  return typeof id === "string" && UUID_RE.test(id.trim())
}

/** 管理画面ヘッダー用（select * は RLS 等で失敗しうるため必要列のみ） */
export const ADMIN_HEADER_PROFILE_SELECT = "id, nickname, display_name, email, is_admin, membership_status"

export async function fetchAdminHeaderProfile(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from(TABLES.PROFILES)
    .select(ADMIN_HEADER_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    console.error("[admin] fetchAdminHeaderProfile:", error.message)
  }
  return data
}

/** RLS で is_admin が読めない場合に service role で再確認 */
async function fetchIsAdminViaServiceRole(userId: string): Promise<boolean> {
  try {
    const service = createServiceRoleClient()
    const { data, error } = await service
      .from(TABLES.PROFILES)
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle()

    if (error) {
      console.error("[admin] service role is_admin check:", error.message)
      return false
    }
    return data?.is_admin === true
  } catch (e) {
    console.error("[admin] service role unavailable:", e)
    return false
  }
}

/** ログインユーザーが管理者か（セッション + 必要なら service role） */
export async function verifyAdminAccess(userId: string): Promise<boolean> {
  const profile = await fetchAdminHeaderProfile(userId)
  if (isSasaeaiAdmin(profile)) return true
  return fetchIsAdminViaServiceRole(userId)
}

/**
 * 管理レイアウト用。未ログイン → /login、非管理者のみ → /dashboard。
 * 管理者の場合は profile を返す（RLS で is_admin が取れないときも service role で通過）。
 */
export async function requireAdminLayoutSession() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await fetchAdminHeaderProfile(user.id)
  if (isSasaeaiAdmin(profile)) {
    return { user, profile }
  }

  const isAdmin = await fetchIsAdminViaServiceRole(user.id)
  if (!isAdmin) {
    redirect("/dashboard")
  }

  return { user, profile: profile ?? { id: user.id, is_admin: true } }
}

/** 未処理通報の最新 ID（管理者のみ・RLS を避けるため service role） */
export async function fetchLatestPendingReportId(adminUserId: string): Promise<string | null> {
  const isAdmin = await verifyAdminAccess(adminUserId)
  if (!isAdmin) return null

  try {
    const service = createServiceRoleClient()
    const { data, error } = await service
      .from(TABLES.REPORTS)
      .select("id")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[admin] fetchLatestPendingReportId:", error.message)
      return null
    }

    const id = typeof data?.id === "string" ? data.id.trim() : ""
    return isValidReportId(id) ? id : null
  } catch (e) {
    console.error("[admin] fetchLatestPendingReportId service role:", e)
    return null
  }
}

/** KPI カード用の安全な href */
export function buildPendingReportCardHref(pendingReportId: string | null): string {
  if (pendingReportId && isValidReportId(pendingReportId)) {
    return `/admin/reports/${pendingReportId}`
  }
  return "/admin/reports?status=pending"
}
