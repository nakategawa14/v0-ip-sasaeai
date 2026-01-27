-- sasaeai_messagesテーブルを再作成
-- 既存のトリガーとテーブルを削除
DROP TRIGGER IF EXISTS update_match_last_message_trigger ON sasaeai_messages;
DROP FUNCTION IF EXISTS update_match_last_message();

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view messages in their matches" ON sasaeai_messages;
DROP POLICY IF EXISTS "Users can insert messages in their matches" ON sasaeai_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON sasaeai_messages;
DROP POLICY IF EXISTS "Users can update messages as read" ON sasaeai_messages;

-- テーブルを削除して再作成
DROP TABLE IF EXISTS sasaeai_messages CASCADE;

-- メッセージテーブルを作成
CREATE TABLE sasaeai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES sasaeai_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_messages_match ON sasaeai_messages(match_id);
CREATE INDEX idx_messages_sender ON sasaeai_messages(sender_id);
CREATE INDEX idx_messages_created_at ON sasaeai_messages(created_at);

-- RLS有効化
ALTER TABLE sasaeai_messages ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: マッチング相手同士のみメッセージを閲覧可能
CREATE POLICY "Users can view messages in their matches" ON sasaeai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sasaeai_matches
      WHERE sasaeai_matches.id = sasaeai_messages.match_id
      AND (sasaeai_matches.user1_id = auth.uid() OR sasaeai_matches.user2_id = auth.uid())
    )
  );

-- RLSポリシー: マッチング相手同士のみメッセージを送信可能
CREATE POLICY "Users can insert messages in their matches" ON sasaeai_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM sasaeai_matches
      WHERE sasaeai_matches.id = sasaeai_messages.match_id
      AND (sasaeai_matches.user1_id = auth.uid() OR sasaeai_matches.user2_id = auth.uid())
    )
  );

-- RLSポリシー: 自分が送信したメッセージのみ削除可能
CREATE POLICY "Users can delete their own messages" ON sasaeai_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- RLSポリシー: 受信者のみメッセージを既読にできる
CREATE POLICY "Users can update messages as read" ON sasaeai_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sasaeai_matches
      WHERE sasaeai_matches.id = sasaeai_messages.match_id
      AND (
        (sasaeai_matches.user1_id = auth.uid() AND sasaeai_messages.sender_id = sasaeai_matches.user2_id)
        OR (sasaeai_matches.user2_id = auth.uid() AND sasaeai_messages.sender_id = sasaeai_matches.user1_id)
      )
    )
  );

-- マッチングテーブルのlast_message_atを更新する関数
CREATE OR REPLACE FUNCTION update_match_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sasaeai_matches
  SET last_message_at = NEW.created_at
  WHERE id = NEW.match_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER update_match_last_message_trigger
AFTER INSERT ON sasaeai_messages
FOR EACH ROW
EXECUTE FUNCTION update_match_last_message();

-- 確認
SELECT 
  'sasaeai_messages' as table_name,
  (SELECT COUNT(*) FROM sasaeai_messages) as row_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'sasaeai_messages') as index_count;
