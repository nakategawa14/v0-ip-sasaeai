-- モデレーション機能用のテーブル作成
-- 通報、ブロック、強制退場機能

-- 通報テーブル
CREATE TABLE IF NOT EXISTS sasaeai_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('harassment', 'spam', 'inappropriate', 'other')),
  report_reason TEXT NOT NULL,
  context_type TEXT NOT NULL CHECK (context_type IN ('group_chat', 'direct_message', 'profile')),
  context_id UUID, -- group_chat_room_id or match_id
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ブロックテーブル
CREATE TABLE IF NOT EXISTS sasaeai_blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_user_id)
);

-- 強制退場記録テーブル
CREATE TABLE IF NOT EXISTS sasaeai_bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('group_chat', 'messaging', 'platform')),
  ban_reason TEXT NOT NULL,
  ban_expires_at TIMESTAMPTZ, -- NULL = 永久BAN
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON sasaeai_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON sasaeai_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON sasaeai_reports(status);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON sasaeai_blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON sasaeai_blocked_users(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_bans_user ON sasaeai_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_type ON sasaeai_bans(ban_type);

-- RLSポリシー設定

-- 通報テーブルのRLS
ALTER TABLE sasaeai_reports ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分が報告した通報のみ閲覧可能
CREATE POLICY "Users can view their own reports"
  ON sasaeai_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- ユーザーは通報を作成可能
CREATE POLICY "Users can create reports"
  ON sasaeai_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- 管理者は全ての通報を閲覧・更新可能
CREATE POLICY "Admins can view all reports"
  ON sasaeai_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update reports"
  ON sasaeai_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ブロックテーブルのRLS
ALTER TABLE sasaeai_blocked_users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のブロックリストを管理可能
CREATE POLICY "Users can manage their blocked list"
  ON sasaeai_blocked_users FOR ALL
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

-- BANテーブルのRLS
ALTER TABLE sasaeai_bans ENABLE ROW LEVEL SECURITY;

-- 管理者のみBANを管理可能
CREATE POLICY "Admins can manage bans"
  ON sasaeai_bans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ユーザーは自分のBAN情報を閲覧可能
CREATE POLICY "Users can view their own bans"
  ON sasaeai_bans FOR SELECT
  USING (auth.uid() = user_id);

-- 管理者フラグをsasaeai_profilesテーブルに追加（存在しない場合）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='sasaeai_profiles' AND column_name='is_admin') THEN
    ALTER TABLE sasaeai_profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 通報数を集計する関数
CREATE OR REPLACE FUNCTION get_user_report_count(user_id_param UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM sasaeai_reports
  WHERE reported_user_id = user_id_param
  AND status IN ('pending', 'action_taken');
$$ LANGUAGE SQL STABLE;

-- ユーザーがBANされているかチェックする関数
CREATE OR REPLACE FUNCTION is_user_banned(user_id_param UUID, ban_type_param TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM sasaeai_bans
    WHERE user_id = user_id_param
    AND ban_type IN (ban_type_param, 'platform')
    AND (ban_expires_at IS NULL OR ban_expires_at > NOW())
  );
$$ LANGUAGE SQL STABLE;
