-- モデレーション機能用のテーブル作成（修正版v3）

-- 1. テーブル作成（IF NOT EXISTSで既存チェック）
-- 通報テーブル
CREATE TABLE IF NOT EXISTS sasaeai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('harassment', 'spam', 'inappropriate', 'other')),
  report_category TEXT NOT NULL CHECK (report_category IN ('group_chat', 'message', 'profile', 'other')),
  related_id UUID,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ブロックテーブル
CREATE TABLE IF NOT EXISTS sasaeai_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_user_id)
);

-- BANテーブル
CREATE TABLE IF NOT EXISTS sasaeai_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('group_chat', 'messaging', 'platform')),
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. インデックス作成
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON sasaeai_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON sasaeai_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON sasaeai_reports(status);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON sasaeai_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_user ON sasaeai_blocks(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_bans_user ON sasaeai_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_expires ON sasaeai_bans(expires_at);

-- 3. RLS有効化
ALTER TABLE sasaeai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_bans ENABLE ROW LEVEL SECURITY;

-- 4. 既存のポリシーを削除（テーブルが存在することを確認してから）
DROP POLICY IF EXISTS "Users can view their own reports" ON sasaeai_reports;
DROP POLICY IF EXISTS "Users can create reports" ON sasaeai_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON sasaeai_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON sasaeai_reports;
DROP POLICY IF EXISTS "Users can view their own blocks" ON sasaeai_blocks;
DROP POLICY IF EXISTS "Users can create blocks" ON sasaeai_blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON sasaeai_blocks;
DROP POLICY IF EXISTS "Users can view bans applied to them" ON sasaeai_bans;
DROP POLICY IF EXISTS "Admins can manage all bans" ON sasaeai_bans;

-- 5. RLSポリシー作成
-- 通報テーブルのRLSポリシー
CREATE POLICY "Users can view their own reports"
  ON sasaeai_reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON sasaeai_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON sasaeai_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update reports"
  ON sasaeai_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ブロックテーブルのRLSポリシー
CREATE POLICY "Users can view their own blocks"
  ON sasaeai_blocks
  FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON sasaeai_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON sasaeai_blocks
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- BANテーブルのRLSポリシー
CREATE POLICY "Users can view bans applied to them"
  ON sasaeai_bans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bans"
  ON sasaeai_bans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- 6. アクティブなBANをチェックする関数
CREATE OR REPLACE FUNCTION check_user_ban(
  p_user_id UUID,
  p_ban_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM sasaeai_bans
    WHERE user_id = p_user_id
      AND ban_type IN (p_ban_type, 'platform')
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;
