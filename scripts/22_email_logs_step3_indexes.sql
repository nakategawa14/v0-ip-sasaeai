-- メール送信ログテーブル作成 - ステップ3: インデックス作成

CREATE INDEX idx_email_logs_user_id ON sasaeai_email_logs(user_id);
CREATE INDEX idx_email_logs_status ON sasaeai_email_logs(status);
CREATE INDEX idx_email_logs_created_at ON sasaeai_email_logs(created_at DESC);

-- 確認
SELECT 
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename = 'sasaeai_email_logs';
