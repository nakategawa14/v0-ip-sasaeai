-- グループチャット関連テーブルでRLSを有効化
-- セキュリティアドバイザーで検出された問題を修正

-- グループチャットルームでRLSを有効化
ALTER TABLE sasaeai_group_chat_rooms ENABLE ROW LEVEL SECURITY;

-- グループチャット参加者でRLSを有効化
ALTER TABLE sasaeai_group_chat_participants ENABLE ROW LEVEL SECURITY;

-- グループチャットメッセージでRLSを有効化
ALTER TABLE sasaeai_group_chat_messages ENABLE ROW LEVEL SECURITY;

-- 確認用クエリ：RLSが有効化されたことを確認
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'sasaeai_group_chat_rooms',
    'sasaeai_group_chat_participants',
    'sasaeai_group_chat_messages'
  )
ORDER BY tablename;
