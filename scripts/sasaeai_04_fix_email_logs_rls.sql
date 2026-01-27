-- email_logsのRLSポリシーを修正（is_adminではなくroleを使用）

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Only admins can view email logs" ON sasaeai_email_logs;

-- 新しいポリシーを作成（roleカラムを使用）
CREATE POLICY "Only admins can view email logs"
  ON sasaeai_email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 管理者のみがメールログを挿入可能
CREATE POLICY "Only admins can insert email logs"
  ON sasaeai_email_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
