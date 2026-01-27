-- グループチャット参加者テーブルのRLSポリシーを完全に修正
-- 無限再帰エラーを解消するため、すべてのポリシーを削除して最もシンプルなポリシーで再作成

-- 1. RLSを一時的に無効化
ALTER TABLE sasaeai_group_chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_group_chat_messages DISABLE ROW LEVEL SECURITY;

-- 2. 既存のすべてのポリシーを削除
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "Users can leave rooms" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "participants_select_policy" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "participants_insert_policy" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "participants_delete_policy" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "Anyone can view participants" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "Users can add themselves" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "Users can remove themselves" ON sasaeai_group_chat_participants;

DROP POLICY IF EXISTS "Users can view messages in their rooms" ON sasaeai_group_chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON sasaeai_group_chat_messages;
DROP POLICY IF EXISTS "messages_select_policy" ON sasaeai_group_chat_messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON sasaeai_group_chat_messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON sasaeai_group_chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON sasaeai_group_chat_messages;

-- 3. RLSを再度有効化
ALTER TABLE sasaeai_group_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_group_chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. 最もシンプルなポリシーを作成（無限再帰が発生しない）

-- 参加者テーブル: 認証されたユーザーは全て閲覧可能
CREATE POLICY "Authenticated users can view all participants"
ON sasaeai_group_chat_participants
FOR SELECT
TO authenticated
USING (true);

-- 参加者テーブル: 認証されたユーザーは誰でも参加可能
CREATE POLICY "Authenticated users can join any room"
ON sasaeai_group_chat_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 参加者テーブル: 自分の参加記録のみ削除可能
CREATE POLICY "Users can leave their own rooms"
ON sasaeai_group_chat_participants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- メッセージテーブル: 認証されたユーザーは全て閲覧可能
CREATE POLICY "Authenticated users can view all messages"
ON sasaeai_group_chat_messages
FOR SELECT
TO authenticated
USING (true);

-- メッセージテーブル: 認証されたユーザーは誰でも送信可能
CREATE POLICY "Authenticated users can send messages"
ON sasaeai_group_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);
