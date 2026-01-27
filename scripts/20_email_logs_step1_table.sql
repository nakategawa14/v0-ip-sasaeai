-- メール送信ログテーブル作成 - ステップ1: テーブル作成のみ
-- 既存のテーブルとインデックスを削除

DROP INDEX IF EXISTS idx_email_logs_status;
DROP INDEX IF EXISTS idx_email_logs_user_id;
DROP INDEX IF EXISTS idx_email_logs_created_at;
DROP TABLE IF EXISTS sasaeai_email_logs;

-- テーブル作成
CREATE TABLE sasaeai_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 確認
SELECT 'テーブル作成完了' as result;
