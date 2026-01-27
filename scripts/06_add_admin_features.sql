-- 管理者機能用のテーブル追加

-- profilesテーブルにuser_typeカラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user' CHECK (user_type IN ('user', 'moderator', 'admin'));

-- ユーザー停止履歴テーブル
CREATE TABLE IF NOT EXISTS user_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  suspended_by UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  details TEXT,
  suspension_type TEXT CHECK (suspension_type IN ('temporary', 'permanent')),
  suspended_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lifted_at TIMESTAMPTZ,
  lifted_by UUID REFERENCES profiles(id)
);

-- モデレーションログテーブル
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'suspend', 'unsuspend', 'delete_message', 'resolve_report', etc.
  target_user_id UUID REFERENCES profiles(id),
  target_resource_type TEXT, -- 'user', 'message', 'report', etc.
  target_resource_id UUID,
  reason TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 統計データテーブル（日次集計）
CREATE TABLE IF NOT EXISTS daily_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  premium_users INTEGER DEFAULT 0,
  new_premium_users INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  new_matches INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  new_messages INTEGER DEFAULT 0,
  total_reports INTEGER DEFAULT 0,
  new_reports INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user ON user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_active ON user_suspensions(is_active);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator ON moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_user ON moderation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON moderation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_statistics_date ON daily_statistics(date);

-- 管理者権限チェック関数
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND user_type IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLSポリシー追加
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_statistics ENABLE ROW LEVEL SECURITY;

-- 管理者のみがアクセス可能
CREATE POLICY "管理者のみuser_suspensionsを閲覧可能" ON user_suspensions
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "管理者のみuser_suspensionsを作成可能" ON user_suspensions
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "管理者のみmoderation_logsを閲覧可能" ON moderation_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "管理者のみmoderation_logsを作成可能" ON moderation_logs
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "管理者のみdaily_statisticsを閲覧可能" ON daily_statistics
  FOR SELECT USING (is_admin(auth.uid()));
