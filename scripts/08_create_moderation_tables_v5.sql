-- モデレーション機能用のテーブル作成（修正版v5）
-- 既存のものを完全に削除してから再作成

-- 既存の関数を削除
DROP FUNCTION IF EXISTS check_user_ban CASCADE;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view their own reports" ON sasaeai_reports CASCADE;
DROP POLICY IF EXISTS "Admins can view all reports" ON sasaeai_reports CASCADE;
DROP POLICY IF EXISTS "Users can create reports" ON sasaeai_reports CASCADE;
DROP POLICY IF EXISTS "Admins can update reports" ON sasaeai_reports CASCADE;

DROP POLICY IF EXISTS "Users can view their own blocks" ON sasaeai_blocks CASCADE;
DROP POLICY IF EXISTS "Users can create blocks" ON sasaeai_blocks CASCADE;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON sasaeai_blocks CASCADE;

DROP POLICY IF EXISTS "Users can view their own bans" ON sasaeai_bans CASCADE;
DROP POLICY IF EXISTS "Admins can view all bans" ON sasaeai_bans CASCADE;
DROP POLICY IF EXISTS "Admins can manage bans" ON sasaeai_bans CASCADE;

-- 既存のインデックスを削除
DROP INDEX IF EXISTS idx_reports_reporter CASCADE;
DROP INDEX IF EXISTS idx_reports_reported_user CASCADE;
DROP INDEX IF EXISTS idx_reports_status CASCADE;
DROP INDEX IF EXISTS idx_blocks_blocker CASCADE;
DROP INDEX IF EXISTS idx_blocks_blocked CASCADE;
DROP INDEX IF EXISTS idx_bans_user CASCADE;
DROP INDEX IF EXISTS idx_bans_active CASCADE;

-- 既存のテーブルを削除
DROP TABLE IF EXISTS sasaeai_bans CASCADE;
DROP TABLE IF EXISTS sasaeai_blocks CASCADE;
DROP TABLE IF EXISTS sasaeai_reports CASCADE;

-- テーブル作成

-- 通報テーブル
CREATE TABLE sasaeai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL, -- 'harassment', 'spam', 'inappropriate_content', 'other'
  context TEXT NOT NULL, -- 'group_chat', 'direct_message', 'profile'
  context_id UUID, -- チャットルームID、メッセージIDなど
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ブロックテーブル
CREATE TABLE sasaeai_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_user_id)
);

-- BANテーブル（管理者が使用）
CREATE TABLE sasaeai_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES sasaeai_profiles(id),
  ban_type TEXT NOT NULL, -- 'group_chat', 'messaging', 'platform'
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ, -- NULLの場合は永久BAN
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス作成
CREATE INDEX idx_reports_reporter ON sasaeai_reports(reporter_id);
CREATE INDEX idx_reports_reported_user ON sasaeai_reports(reported_user_id);
CREATE INDEX idx_reports_status ON sasaeai_reports(status);
CREATE INDEX idx_blocks_blocker ON sasaeai_blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON sasaeai_blocks(blocked_user_id);
CREATE INDEX idx_bans_user ON sasaeai_bans(user_id);
CREATE INDEX idx_bans_active ON sasaeai_bans(user_id, expires_at) WHERE expires_at IS NULL OR expires_at > now();

-- RLS有効化
ALTER TABLE sasaeai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_bans ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成

-- 通報テーブルのポリシー
CREATE POLICY "Users can view their own reports"
  ON sasaeai_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON sasaeai_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can create reports"
  ON sasaeai_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports"
  ON sasaeai_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ブロックテーブルのポリシー
CREATE POLICY "Users can view their own blocks"
  ON sasaeai_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON sasaeai_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON sasaeai_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- BANテーブルのポリシー
CREATE POLICY "Users can view their own bans"
  ON sasaeai_bans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bans"
  ON sasaeai_bans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage bans"
  ON sasaeai_bans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- BAN チェック関数
CREATE OR REPLACE FUNCTION check_user_ban(
  p_user_id UUID,
  p_ban_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM sasaeai_bans
    WHERE user_id = p_user_id
    AND ban_type IN (p_ban_type, 'platform')
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
