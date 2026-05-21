import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"

/** sasaeai_profiles.is_admin === true のみ管理者 */
export function isSasaeaiAdmin(profile: { is_admin?: boolean | null } | null | undefined): boolean {
  return profile?.is_admin === true
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
