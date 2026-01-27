-- sasaeai_messagesテーブルのリアルタイム機能を有効化

-- リアルタイムpublicationを作成（既存の場合は無視）
DO $$
BEGIN
  -- supabase_realtimeがなければ作成
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- sasaeai_messagesテーブルをリアルタイムpublicationに追加
ALTER PUBLICATION supabase_realtime ADD TABLE sasaeai_messages;

-- 確認
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
