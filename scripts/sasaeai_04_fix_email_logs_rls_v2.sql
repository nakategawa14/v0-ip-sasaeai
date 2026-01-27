-- email_logsテーブルのRLSポリシーを修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Only admins can insert email logs" ON sasaeai_email_logs;
DROP POLICY IF EXISTS "Only admins can view email logs" ON sasaeai_email_logs;

-- 新しいポリシーを作成（管理者のみがINSERT可能）
CREATE POLICY "Admins can insert email logs"
ON sasaeai_email_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sasaeai_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- 管理者のみがSELECT可能
CREATE POLICY "Admins can view email logs"
ON sasaeai_email_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sasaeai_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);
