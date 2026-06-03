import type { SupabaseClient } from "@supabase/supabase-js"

import { TABLES } from "@/lib/constants/tables"
import { saveBlockToBlocksTable } from "@/lib/blocks/saveBlockToBlocksTable"

/** 直近7日で同一ユーザーが受け取ったブロック件数がこの値以上なら is_flagged を立てる（雛形） */
const RECENT_BLOCK_FLAG_THRESHOLD = 3
const RECENT_BLOCK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Web 版と同一の sasaeai_blocks（別名 user_blocks 想定）へ upsert。
 * DB 側で UNIQUE(blocker_id, blocked_id) が必要（scripts/sasaeai_blocks_and_notifications_skeleton.sql 参照）。
 */
export async function upsertUserBlock(
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string,
): Promise<{ error: string | null }> {
  return saveBlockToBlocksTable(supabase, blockerId, blockedId)
}

export async function removeUserBlock(
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLES.BLOCKS).delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId)
  return { error: error?.message ?? null }
}

export async function hasBlockFromViewerToPeer(
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from(TABLES.BLOCKS)
    .select("blocker_id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle()
  return !!data
}

/**
 * 運営把握用: sasaeai_system_notifications へ監査ログ的 insert（テーブル未作成時は失敗して無視）。
 * 本番では DB トリガーに寄せる想定でもよい。
 */
export async function insertBlockAdminNotification(
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const payload: Record<string, unknown> = {
    event_type: "user_blocked",
    actor_user_id: blockerId,
    subject_user_id: blockedId,
    created_at_client: new Date().toISOString(),
    source: "mobile_app",
  }
  const { error } = await supabase
    .from(TABLES.SYSTEM_NOTIFICATIONS)
    .insert({ event_type: "user_blocked", payload } as Record<string, unknown>)
  if (__DEV__ && error) {
    console.warn("[block] system_notifications insert skipped:", error.message)
  }
}

/**
 * 短期間に複数人からブロックされたユーザーを検知しやすくする is_flagged 更新（雛形）。
 * sasaeai_profiles.is_flagged が無い場合はエラーとなり無視。
 */
export async function maybeFlagBlockedUserAfterBlock(
  supabase: SupabaseClient,
  blockedUserId: string,
): Promise<void> {
  const since = new Date(Date.now() - RECENT_BLOCK_WINDOW_MS).toISOString()
  const { count, error: cErr } = await supabase
    .from(TABLES.BLOCKS)
    .select("*", { count: "exact", head: true })
    .eq("blocked_id", blockedUserId)
    .gte("created_at", since)

  if (cErr || count == null) return
  if (count < RECENT_BLOCK_FLAG_THRESHOLD) return

  const { error: uErr } = await supabase
    .from(TABLES.PROFILES)
    .update({ is_flagged: true } as Record<string, unknown>)
    .eq("id", blockedUserId)

  if (__DEV__ && uErr) {
    console.warn("[block] is_flagged update skipped:", uErr.message)
  }
}
