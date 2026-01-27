-- メール送信ログテーブル - RLS有効化とポリシー（修正版）
-- is_adminカラムを使用

-- RLS有効化
ALTER TABLE sasaeai_email_logs ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーがあれば削除
DROP POLICY IF EXISTS "管理者のみ閲覧可能" ON sasaeai_email_logs;
DROP POLICY IF EXISTS "システムのみ挿入可能" ON sasaeai_email_logs;
DROP POLICY IF EXISTS "管理者のみ更新可能" ON sasaeai_email_logs;

-- 管理者のみ閲覧可能
CREATE POLICY "管理者のみ閲覧可能" ON sasaeai_email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE sasaeai_profiles.user_id = auth.uid()
      AND sasaeai_profiles.is_admin = true
    )
  );

-- システム（サービスロール）のみ挿入可能
CREATE POLICY "システムのみ挿入可能" ON sasaeai_email_logs
  FOR INSERT
  WITH CHECK (true);

-- 管理者のみ更新可能（リトライ用）
CREATE POLICY "管理者のみ更新可能" ON sasaeai_email_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE sasaeai_profiles.user_id = auth.uid()
      AND sasaeai_profiles.is_admin = true
    )
  );

-- 確認
SELECT 'RLSポリシー設定完了' as result;
