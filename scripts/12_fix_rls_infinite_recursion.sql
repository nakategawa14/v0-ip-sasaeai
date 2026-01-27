-- RLSポリシーの無限再帰を修正

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "Users can leave rooms" ON sasaeai_group_chat_participants;

-- 新しいポリシーを作成（無限再帰を回避）
CREATE POLICY "Users can view participants in their rooms"
ON sasaeai_group_chat_participants FOR SELECT
USING (true);

CREATE POLICY "Users can join rooms"
ON sasaeai_group_chat_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
ON sasaeai_group_chat_participants FOR DELETE
USING (auth.uid() = user_id);
