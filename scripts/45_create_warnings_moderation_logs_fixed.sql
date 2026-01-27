-- 警告テーブルとモデレーションログテーブルを作成（修正版）

-- 1. 警告テーブルを作成
CREATE TABLE IF NOT EXISTS sasaeai_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  warned_by UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE SET NULL,
  report_id UUID REFERENCES sasaeai_reports(id) ON DELETE SET NULL,
  warning_level TEXT NOT NULL DEFAULT 'warning' CHECK (warning_level IN ('warning', 'serious', 'final')),
  reason TEXT NOT NULL,
  details TEXT,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. モデレーションログテーブルを作成
CREATE TABLE IF NOT EXISTS sasaeai_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES sasaeai_profiles(id) ON DELETE SET NULL,
  report_id UUID REFERENCES sasaeai_reports(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'report_status_change',
    'user_ban',
    'user_unban',
    'user_warning',
    'user_block',
    'message_delete',
    'profile_edit',
    'verification_approve',
    'verification_reject',
    'other'
  )),
  action_details JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 警告テーブルのRLS設定
ALTER TABLE sasaeai_warnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "警告は管理者のみ閲覧可能" ON sasaeai_warnings;
CREATE POLICY "警告は管理者のみ閲覧可能" ON sasaeai_warnings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "警告は管理者のみ作成可能" ON sasaeai_warnings;
CREATE POLICY "警告は管理者のみ作成可能" ON sasaeai_warnings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "警告は管理者のみ更新可能" ON sasaeai_warnings;
CREATE POLICY "警告は管理者のみ更新可能" ON sasaeai_warnings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
    OR (user_id = auth.uid() AND is_acknowledged = false)
  );

-- 4. モデレーションログテーブルのRLS設定
ALTER TABLE sasaeai_moderation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "モデレーションログは管理者のみ閲覧可能" ON sasaeai_moderation_logs;
CREATE POLICY "モデレーションログは管理者のみ閲覧可能" ON sasaeai_moderation_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "モデレーションログは管理者のみ作成可能" ON sasaeai_moderation_logs;
CREATE POLICY "モデレーションログは管理者のみ作成可能" ON sasaeai_moderation_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 5. インデックス作成
CREATE INDEX IF NOT EXISTS idx_warnings_user_id ON sasaeai_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_warnings_created_at ON sasaeai_warnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_admin_id ON sasaeai_moderation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_user_id ON sasaeai_moderation_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON sasaeai_moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action_type ON sasaeai_moderation_logs(action_type);

-- 6. 確認
SELECT 'sasaeai_warnings' as table_name, COUNT(*) as row_count FROM sasaeai_warnings
UNION ALL
SELECT 'sasaeai_moderation_logs' as table_name, COUNT(*) as row_count FROM sasaeai_moderation_logs;
