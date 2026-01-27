-- モデレーション機能：ステップ1 - テーブル作成のみ（修正版）

-- 既存のインデックスを削除（存在する場合）
DROP INDEX IF EXISTS idx_reports_reporter;
DROP INDEX IF EXISTS idx_reports_reported_user;
DROP INDEX IF EXISTS idx_reports_status;
DROP INDEX IF EXISTS idx_blocks_blocker;
DROP INDEX IF EXISTS idx_blocks_blocked;
DROP INDEX IF EXISTS idx_bans_banned_user;
DROP INDEX IF EXISTS idx_bans_active;

-- 既存のテーブルを削除（存在する場合）
DROP TABLE IF EXISTS sasaeai_reports CASCADE;
DROP TABLE IF EXISTS sasaeai_blocks CASCADE;
DROP TABLE IF EXISTS sasaeai_bans CASCADE;

-- 通報テーブル
CREATE TABLE sasaeai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('harassment', 'spam', 'inappropriate', 'fake_profile', 'other')),
  context_type TEXT NOT NULL CHECK (context_type IN ('message', 'profile', 'group_chat')),
  context_id UUID,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ブロックテーブル
CREATE TABLE sasaeai_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_user_id)
);

-- BANテーブル
CREATE TABLE sasaeai_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('group_chat', 'messaging', 'platform')),
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- インデックス作成
CREATE INDEX idx_reports_reporter ON sasaeai_reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON sasaeai_reports(reported_user_id);
CREATE INDEX idx_reports_status ON sasaeai_reports(status);
CREATE INDEX idx_blocks_blocker ON sasaeai_blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON sasaeai_blocks(blocked_user_id);
CREATE INDEX idx_bans_banned_user ON sasaeai_bans(banned_user_id);
CREATE INDEX idx_bans_active ON sasaeai_bans(is_active, expires_at);
