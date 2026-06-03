import type { SupabaseClient } from "@supabase/supabase-js"

import { TABLES } from "@/lib/constants/tables"

/**
 * 自分がブロックしたユーザーの id のみ（blocker_id = 自分）。
 * ユーザー一覧など「ブロックした相手を出さない」用途向け。
 */
export async function fetchBlockedPeerIdsWhereViewerIsBlocker(
  supabase: SupabaseClient,
  myId: string,
): Promise<{ blocked: Set<string>; error: string | null }> {
  const { data, error } = await supabase.from(TABLES.BLOCKS).select("blocked_id").eq("blocker_id", myId)
  if (error) {
    return { blocked: new Set(), error: error.message }
  }
  const blocked = new Set<string>((data ?? []).map((r) => String((r as { blocked_id: string }).blocked_id)))
  return { blocked, error: null }
}

/**
 * 自分がブロックした相手・自分をブロックした相手の user id をまとめた集合。
 * 「さがす」一覧・メッセージ一覧などで除外するための共通フィルタ雛形。
 */
export async function fetchBidirectionalBlockedPeerIds(
  supabase: SupabaseClient,
  myId: string,
): Promise<{ blocked: Set<string>; error: string | null }> {
  const [{ data: blockedA, error: e1 }, { data: blockedB, error: e2 }] = await Promise.all([
    supabase.from(TABLES.BLOCKS).select("blocked_id").eq("blocker_id", myId),
    supabase.from(TABLES.BLOCKS).select("blocker_id").eq("blocked_id", myId),
  ])
  const errMsg = e1?.message ?? e2?.message ?? null
  if (errMsg) {
    return { blocked: new Set(), error: errMsg }
  }
  const blocked = new Set<string>([
    ...(blockedA ?? []).map((r) => String((r as { blocked_id: string }).blocked_id)),
    ...(blockedB ?? []).map((r) => String((r as { blocker_id: string }).blocker_id)),
  ])
  return { blocked, error: null }
}
