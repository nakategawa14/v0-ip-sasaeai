-- 警告テーブルとモデレーションログテーブルを作成

-- 既存のテーブルとポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "管理者は全ての警告を閲覧可能" ON sasaeai_warnings;
DROP POLICY IF EXISTS "ユーザーは自分への警告を閲覧可能" ON sasaeai_warnings;
DROP POLICY IF EXISTS "管理者は警告を作成可能" ON sasaeai_warnings;
DROP POLICY IF EXISTS "管理者は全てのログを閲覧可能" ON sasaeai_moderation_logs;
DROP POLICY IF EXISTS "管理者はログを作成可能" ON sasaeai_moderation_logs;

DROP TABLE IF EXISTS sasaeai_warnings CASCADE;
DROP TABLE IF EXISTS sasaeai_moderation_logs CASCADE;

-- 警告テーブル
CREATE TABLE sasaeai_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning', 'serious_warning', 'final_warning')),
  related_report_id UUID REFERENCES sasaeai_reports(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- モデレーションログテーブル
CREATE TABLE sasaeai_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'warning_issued',
    'user_banned',
    'user_unbanned',
    'report_resolved',
    'report_dismissed',
    'user_suspended',
    'user_unsuspended',
    'content_removed',
    'verification_approved',
    'verification_rejected'
  )),
  target_user_id UUID REFERENCES sasaeai_profiles(id) ON DELETE SET NULL,
  target_report_id UUID REFERENCES sasaeai_reports(id) ON DELETE SET NULL,
  details JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_warnings_user_id ON sasaeai_warnings(user_id);
CREATE INDEX idx_warnings_created_at ON sasaeai_warnings(created_at DESC);
CREATE INDEX idx_moderation_logs_admin_id ON sasaeai_moderation_logs(admin_id);
CREATE INDEX idx_moderation_logs_target_user_id ON sasaeai_moderation_logs(target_user_id);
CREATE INDEX idx_moderation_logs_action_type ON sasaeai_moderation_logs(action_type);
CREATE INDEX idx_moderation_logs_created_at ON sasaeai_moderation_logs(created_at DESC);

-- RLS有効化
ALTER TABLE sasaeai_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_moderation_logs ENABLE ROW LEVEL SECURITY;

-- 警告テーブルのRLSポリシー
CREATE POLICY "管理者は全ての警告を閲覧可能" ON sasaeai_warnings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "ユーザーは自分への警告を閲覧可能" ON sasaeai_warnings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "管理者は警告を作成可能" ON sasaeai_warnings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "管理者は警告を更新可能" ON sasaeai_warnings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- モデレーションログのRLSポリシー
CREATE POLICY "管理者は全てのログを閲覧可能" ON sasaeai_moderation_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "管理者はログを作成可能" ON sasaeai_moderation_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 結果確認
SELECT 
  'sasaeai_warnings' as table_name,
  (SELECT COUNT(*) FROM sasaeai_warnings) as row_count
UNION ALL
SELECT 
  'sasaeai_moderation_logs' as table_name,
  (SELECT COUNT(*) FROM sasaeai_moderation_logs) as row_count;
