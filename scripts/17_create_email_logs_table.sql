-- メール送信ログテーブルを作成
-- 送信履歴の保存とリトライ機能のサポート

-- メール送信ログテーブル
CREATE TABLE IF NOT EXISTS sasaeai_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'verification_approved', 'verification_rejected', 'bulk', 'individual', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'retrying'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON sasaeai_email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON sasaeai_email_logs(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON sasaeai_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON sasaeai_email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON sasaeai_email_logs(created_at DESC);

-- RLSを有効化
ALTER TABLE sasaeai_email_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみアクセス可能
CREATE POLICY "Admins can view email logs"
  ON sasaeai_email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert email logs"
  ON sasaeai_email_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update email logs"
  ON sasaeai_email_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- 確認用クエリ
SELECT 'sasaeai_email_logs table created successfully' as status;
