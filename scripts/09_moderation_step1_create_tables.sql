-- モデレーション機能：ステップ1 - テーブル作成のみ

-- 既存のテーブルを削除
DROP TABLE IF EXISTS sasaeai_reports CASCADE;
DROP TABLE IF EXISTS sasaeai_blocks CASCADE;
DROP TABLE IF EXISTS sasaeai_bans CASCADE;

-- 通報テーブル
CREATE TABLE sasaeai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('harassment', 'inappropriate_content', 'spam', 'fake_profile', 'other')),
  context_type TEXT NOT NULL CHECK (context_type IN ('group_chat', 'direct_message', 'profile')),
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
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_user_id)
);

-- BANテーブル
CREATE TABLE sasaeai_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('group_chat', 'messaging', 'platform')),
  reason TEXT NOT NULL,
  banned_by UUID NOT NULL REFERENCES auth.users(id),
  banned_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_reports_reporter ON sasaeai_reports(reporter_id);
CREATE INDEX idx_reports_reported ON sasaeai_reports(reported_user_id);
CREATE INDEX idx_reports_status ON sasaeai_reports(status);
CREATE INDEX idx_blocks_blocker ON sasaeai_blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON sasaeai_blocks(blocked_user_id);
CREATE INDEX idx_bans_user ON sasaeai_bans(user_id);
CREATE INDEX idx_bans_type ON sasaeai_bans(ban_type);
