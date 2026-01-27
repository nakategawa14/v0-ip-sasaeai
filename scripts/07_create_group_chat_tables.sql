-- グループチャット機能用のテーブル作成

-- グループチャットルームテーブル
CREATE TABLE IF NOT EXISTS sasaeai_group_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'グループチャット',
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  participant_count INTEGER DEFAULT 0
);

-- グループチャットメッセージテーブル
CREATE TABLE IF NOT EXISTS sasaeai_group_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES sasaeai_group_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- グループチャット参加者テーブル
CREATE TABLE IF NOT EXISTS sasaeai_group_chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES sasaeai_group_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_group_chat_rooms_last_activity ON sasaeai_group_chat_rooms(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_chat_rooms_is_active ON sasaeai_group_chat_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_room_id ON sasaeai_group_chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_chat_participants_room_id ON sasaeai_group_chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_participants_user_id ON sasaeai_group_chat_participants(user_id);

-- RLSポリシー有効化
ALTER TABLE sasaeai_group_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_group_chat_participants ENABLE ROW LEVEL SECURITY;

-- グループチャットルームのRLSポリシー
-- 全員が閲覧可能
CREATE POLICY "Group chat rooms are viewable by authenticated users"
  ON sasaeai_group_chat_rooms FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- 女性と有料男性のみが作成可能
CREATE POLICY "Group chat rooms can be created by women and paid men"
  ON sasaeai_group_chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid()
      AND (gender = 'female' OR membership_status = 'paid')
    )
  );

-- グループチャットメッセージのRLSポリシー
-- 参加者のみが閲覧可能
CREATE POLICY "Group chat messages are viewable by participants"
  ON sasaeai_group_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_group_chat_participants
      WHERE room_id = sasaeai_group_chat_messages.room_id
      AND user_id = auth.uid()
    )
  );

-- 女性と有料男性の参加者のみが送信可能
CREATE POLICY "Group chat messages can be sent by women and paid men participants"
  ON sasaeai_group_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid()
      AND (gender = 'female' OR membership_status = 'paid')
    )
    AND EXISTS (
      SELECT 1 FROM sasaeai_group_chat_participants
      WHERE room_id = sasaeai_group_chat_messages.room_id
      AND user_id = auth.uid()
    )
  );

-- グループチャット参加者のRLSポリシー
-- 参加者のみが閲覧可能
CREATE POLICY "Group chat participants are viewable by participants"
  ON sasaeai_group_chat_participants FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM sasaeai_group_chat_participants
      WHERE user_id = auth.uid()
    )
  );

-- 女性と有料男性のみが参加可能
CREATE POLICY "Women and paid men can join group chats"
  ON sasaeai_group_chat_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid()
      AND (gender = 'female' OR membership_status = 'paid')
    )
    AND user_id = auth.uid()
  );

-- 自分のみが退出可能
CREATE POLICY "Users can leave group chats"
  ON sasaeai_group_chat_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 最終活動日時を更新する関数
CREATE OR REPLACE FUNCTION update_group_chat_room_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sasaeai_group_chat_rooms
  SET last_activity_at = NOW()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- メッセージ送信時に最終活動日時を更新するトリガー
CREATE TRIGGER update_group_chat_room_last_activity_trigger
AFTER INSERT ON sasaeai_group_chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_group_chat_room_last_activity();

-- 参加者数を更新する関数
CREATE OR REPLACE FUNCTION update_group_chat_room_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sasaeai_group_chat_rooms
    SET participant_count = participant_count + 1
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sasaeai_group_chat_rooms
    SET participant_count = participant_count - 1
    WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 参加者追加/削除時に参加者数を更新するトリガー
CREATE TRIGGER update_group_chat_room_participant_count_trigger
AFTER INSERT OR DELETE ON sasaeai_group_chat_participants
FOR EACH ROW
EXECUTE FUNCTION update_group_chat_room_participant_count();

-- 48時間非アクティブなルームを削除する関数
CREATE OR REPLACE FUNCTION delete_inactive_group_chat_rooms()
RETURNS void AS $$
BEGIN
  -- 48時間以上活動がないルームを非アクティブ化
  UPDATE sasaeai_group_chat_rooms
  SET is_active = FALSE
  WHERE last_activity_at < NOW() - INTERVAL '48 hours'
  AND is_active = TRUE;
  
  -- 非アクティブなルームのメッセージと参加者を削除
  DELETE FROM sasaeai_group_chat_messages
  WHERE room_id IN (
    SELECT id FROM sasaeai_group_chat_rooms
    WHERE is_active = FALSE
  );
  
  DELETE FROM sasaeai_group_chat_participants
  WHERE room_id IN (
    SELECT id FROM sasaeai_group_chat_rooms
    WHERE is_active = FALSE
  );
  
  -- 非アクティブなルームを削除
  DELETE FROM sasaeai_group_chat_rooms
  WHERE is_active = FALSE;
END;
$$ LANGUAGE plpgsql;

-- デフォルトのグローバルチャットルームを作成
INSERT INTO sasaeai_group_chat_rooms (name, description, created_by)
SELECT 
  'みんなのチャットルーム',
  'ささえ愛ユーザー全員が参加できるグローバルチャットルームです。気軽にお話ししましょう。',
  id
FROM sasaeai_profiles
WHERE is_admin = TRUE
LIMIT 1
ON CONFLICT DO NOTHING;
