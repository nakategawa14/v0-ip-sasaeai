/** Web 版 lib/supabase/table-names.ts と同一（モバイルから参照用） */
export const TABLES = {
  PROFILES: "sasaeai_profiles",
  PROFILE_TAGS: "sasaeai_profile_tags",
  /** ブロック（Web では user_blocks 相当）。blocker_id / blocked_id / created_at */
  BLOCKS: "sasaeai_blocks",
  LIKES: "sasaeai_likes",
  MATCHES: "sasaeai_matches",
  CHAT_ROOMS: "sasaeai_chat_rooms",
  CHAT_MESSAGES: "sasaeai_chat_messages",
  /** 通報（reporter_id / reported_id 等） */
  REPORTS: "sasaeai_reports",
  /** 運営向け監査・通知ログ（未作成環境では insert が失敗してよい） */
  SYSTEM_NOTIFICATIONS: "sasaeai_system_notifications",
} as const
