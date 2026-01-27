-- メール送信ログテーブルの完全再作成
-- 既存のインデックスとテーブルを全て削除してから再作成

-- 既存のインデックスを削除
DROP INDEX IF EXISTS idx_email_logs_status;
DROP INDEX IF EXISTS idx_email_logs_recipient;
DROP INDEX IF EXISTS idx_email_logs_created_at;

-- 既存のテーブルを削除（RLSポリシーも一緒に削除される）
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE sasaeai_email_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能
CREATE POLICY "管理者はメールログを閲覧可能" ON sasaeai_email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- サーバーサイドからの挿入を許可（service roleで実行）
CREATE POLICY "サービスロールはメールログを挿入可能" ON sasaeai_email_logs
  FOR INSERT
  WITH CHECK (true);

-- インデックスを作成
CREATE INDEX idx_email_logs_status ON sasaeai_email_logs(status);
CREATE INDEX idx_email_logs_recipient ON sasaeai_email_logs(recipient_email);
CREATE INDEX idx_email_logs_created_at ON sasaeai_email_logs(created_at DESC);

-- 確認
SELECT 'sasaeai_email_logs table created successfully' as result;
