-- sasaeai_email_logsテーブルにhtml_contentカラムを追加
-- これによりリトライ時に元のHTMLを再利用できる

-- html_contentカラムを追加（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sasaeai_email_logs' AND column_name = 'html_content'
  ) THEN
    ALTER TABLE sasaeai_email_logs ADD COLUMN html_content TEXT;
  END IF;
END $$;

-- 確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_email_logs' 
  AND column_name IN ('html_content', 'retry_count', 'status')
ORDER BY column_name;
