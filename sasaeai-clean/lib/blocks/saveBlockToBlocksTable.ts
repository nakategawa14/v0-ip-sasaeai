import type { SupabaseClient } from "@supabase/supabase-js"

import { TABLES } from "@/lib/constants/tables"

/**
 * Supabase のブロック用テーブル（`TABLES.BLOCKS` = `sasaeai_blocks`）に
 * 自分の user id（blocker）と相手の user id（blocked）を保存する。
 * DB 側で UNIQUE(blocker_id, blocked_id) がある前提で upsert。
 */
export async function saveBlockToBlocksTable(
  supabase: SupabaseClient,
  viewerUserId: string,
  peerUserId: string,
): Promise<{ error: string | null }> {
  if (!viewerUserId || !peerUserId) {
    return { error: "ユーザー ID が不正です" }
  }
  if (viewerUserId === peerUserId) {
    return { error: "自分自身をブロックできません" }
  }

  const row = {
    blocker_id: viewerUserId,
    blocked_id: peerUserId,
    created_at: new Date().toISOString(),
  }
  const { error } = await supabase.from(TABLES.BLOCKS).upsert(row, {
    onConflict: "blocker_id,blocked_id",
  })
  return { error: error?.message ?? null }
}
