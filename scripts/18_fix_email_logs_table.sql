-- メール送信ログテーブルの修正
-- 既存テーブルがある場合は削除して再作成

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "管理者のみメールログを閲覧可能" ON sasaeai_email_logs;
DROP POLICY IF EXISTS "システムがメールログを作成可能" ON sasaeai_email_logs;

-- 既存テーブルを削除（存在する場合）
DROP TABLE IF EXISTS sasaeai_email_logs;

-- メール送信ログテーブルを作成
CREATE TABLE sasaeai_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  last_retry_at TIMESTAMPTZ
);

-- インデックスを作成
CREATE INDEX idx_email_logs_recipient ON sasaeai_email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON sasaeai_email_logs(status);
CREATE INDEX idx_email_logs_type ON sasaeai_email_logs(email_type);
CREATE INDEX idx_email_logs_created_at ON sasaeai_email_logs(created_at DESC);

-- RLSを有効化
ALTER TABLE sasaeai_email_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能
CREATE POLICY "管理者のみメールログを閲覧可能"
ON sasaeai_email_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sasaeai_profiles
    WHERE sasaeai_profiles.id = auth.uid()
    AND sasaeai_profiles.role = 'admin'
  )
);

-- 認証済みユーザーがログを作成可能（API経由）
CREATE POLICY "認証済みユーザーがメールログを作成可能"
ON sasaeai_email_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 確認クエリ
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_email_logs'
ORDER BY ordinal_position;
