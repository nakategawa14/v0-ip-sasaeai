-- メッセージテーブル
CREATE TABLE IF NOT EXISTS sasaeai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES sasaeai_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_messages_match ON sasaeai_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON sasaeai_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON sasaeai_messages(created_at);

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
DROP TRIGGER IF EXISTS update_match_last_message_trigger ON sasaeai_messages;
CREATE TRIGGER update_match_last_message_trigger
AFTER INSERT ON sasaeai_messages
FOR EACH ROW
EXECUTE FUNCTION update_match_last_message();
