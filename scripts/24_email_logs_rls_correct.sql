-- メール送信ログテーブル - RLS有効化とポリシー（カラム名修正版）

-- 既存ポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "管理者のみ閲覧可能" ON sasaeai_email_logs;
DROP POLICY IF EXISTS "管理者のみ挿入可能" ON sasaeai_email_logs;
DROP POLICY IF EXISTS "管理者のみ更新可能" ON sasaeai_email_logs;

-- RLSを有効化
ALTER TABLE sasaeai_email_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能ポリシー（idカラムを使用）
CREATE POLICY "管理者のみ閲覧可能" ON sasaeai_email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE sasaeai_profiles.id = auth.uid()
      AND sasaeai_profiles.is_admin = true
    )
  );

-- 管理者のみ挿入可能ポリシー
CREATE POLICY "管理者のみ挿入可能" ON sasaeai_email_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE sasaeai_profiles.id = auth.uid()
      AND sasaeai_profiles.is_admin = true
    )
  );

-- 管理者のみ更新可能ポリシー
CREATE POLICY "管理者のみ更新可能" ON sasaeai_email_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE sasaeai_profiles.id = auth.uid()
      AND sasaeai_profiles.is_admin = true
    )
  );

-- 確認
SELECT 'RLS有効化完了' as result;
