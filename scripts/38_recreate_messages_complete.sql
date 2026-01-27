-- sasaeai_messagesテーブルを完全に再作成

-- 1. 既存のインデックスを削除
DROP INDEX IF EXISTS idx_messages_match_id;
DROP INDEX IF EXISTS idx_messages_sender_id;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_messages_is_read;

-- 2. 既存のトリガーを削除
DROP TRIGGER IF EXISTS update_match_last_message ON sasaeai_messages;
DROP FUNCTION IF EXISTS update_match_last_message_timestamp();

-- 3. 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view messages in their matches" ON sasaeai_messages;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON sasaeai_messages;
DROP POLICY IF EXISTS "Users can update read status" ON sasaeai_messages;

-- 4. 既存のテーブルを削除
DROP TABLE IF EXISTS sasaeai_messages CASCADE;

-- 5. メッセージテーブルを作成
CREATE TABLE sasaeai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES sasaeai_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. インデックスを作成
CREATE INDEX idx_messages_match_id ON sasaeai_messages(match_id);
CREATE INDEX idx_messages_sender_id ON sasaeai_messages(sender_id);
CREATE INDEX idx_messages_created_at ON sasaeai_messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON sasaeai_messages(is_read) WHERE is_read = FALSE;

-- 7. RLSを有効化
ALTER TABLE sasaeai_messages ENABLE ROW LEVEL SECURITY;

-- 8. RLSポリシーを作成
-- マッチのメンバーのみメッセージを閲覧可能
CREATE POLICY "Users can view messages in their matches"
ON sasaeai_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sasaeai_matches m
    WHERE m.id = match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    AND m.is_active = TRUE
  )
);

-- マッチのメンバーのみメッセージを送信可能
CREATE POLICY "Users can send messages in their matches"
ON sasaeai_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM sasaeai_matches m
    WHERE m.id = match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    AND m.is_active = TRUE
  )
);

-- 受信者のみ既読ステータスを更新可能
CREATE POLICY "Users can update read status"
ON sasaeai_messages FOR UPDATE
USING (
  sender_id != auth.uid()
  AND EXISTS (
    SELECT 1 FROM sasaeai_matches m
    WHERE m.id = match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
)
WITH CHECK (
  sender_id != auth.uid()
  AND EXISTS (
    SELECT 1 FROM sasaeai_matches m
    WHERE m.id = match_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  )
);

-- 9. last_message_at更新用のトリガー関数
CREATE OR REPLACE FUNCTION update_match_last_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sasaeai_matches
  SET last_message_at = NEW.created_at
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. トリガーを作成
CREATE TRIGGER update_match_last_message
AFTER INSERT ON sasaeai_messages
FOR EACH ROW
EXECUTE FUNCTION update_match_last_message_timestamp();

-- 11. 確認
SELECT 
  'sasaeai_messages' as table_name,
  (SELECT COUNT(*) FROM sasaeai_messages) as row_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'sasaeai_messages') as index_count;
