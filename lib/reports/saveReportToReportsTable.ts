import type { SupabaseClient } from "@supabase/supabase-js"

import { TABLES } from "@/lib/constants/tables"

/**
 * `sasaeai_reports`（`TABLES.REPORTS`）へ通報行を insert する。
 * reporter_id = 自分、reported_id = 相手の user id。
 */
export async function saveReportToReportsTable(
  supabase: SupabaseClient,
  reporterUserId: string,
  reportedUserId: string,
  extra?: Record<string, string | null>,
): Promise<{ error: string | null }> {
  if (!reporterUserId || !reportedUserId) {
    return { error: "ユーザー ID が不正です" }
  }
  if (reporterUserId === reportedUserId) {
    return { error: "自分自身を通報できません" }
  }

  const row: Record<string, string | null> = {
    reporter_id: reporterUserId,
    reported_id: reportedUserId,
    created_at: new Date().toISOString(),
    ...(extra ?? {}),
  }
  const { error } = await supabase.from(TABLES.REPORTS).insert(row)
  return { error: error?.message ?? null }
}
