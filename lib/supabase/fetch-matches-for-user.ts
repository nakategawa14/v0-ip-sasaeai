import { TABLES } from "@/lib/constants/tables";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ユーザーが user1_id または user2_id として参加しているマッチ行を取得する。
 */
export async function fetchMatchesParticipatedByUser(
  client: SupabaseClient,
  userId: string,
  select: string,
): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
  const [asUser1, asUser2] = await Promise.all([
    client.from(TABLES.MATCHES).select(select).eq("user1_id", userId),
    client.from(TABLES.MATCHES).select(select).eq("user2_id", userId),
  ])

  if (asUser1.error) return { data: null, error: asUser1.error }
  if (asUser2.error) return { data: null, error: asUser2.error }

  const byId = new Map<string, unknown>()
  for (const row of [...(asUser1.data ?? []), ...(asUser2.data ?? [])]) {
    const r = row as { id?: string }
    if (r?.id) byId.set(r.id, row)
  }
  return { data: Array.from(byId.values()), error: null }
}

