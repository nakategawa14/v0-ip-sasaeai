-- 既存のポリシーをすべて削除して再作成
-- sasaeai_group_chat_participantsテーブルのRLSポリシーを完全に修正

-- すべての既存ポリシーを削除
DROP POLICY IF EXISTS "select_group_chat_participants" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "insert_group_chat_participants" ON sasaeai_group_chat_participants;
DROP POLICY IF EXISTS "delete_group_chat_participants" ON sasaeai_group_chat_participants;

-- シンプルなポリシーで再作成（無限再帰を避ける）

-- SELECT: 認証されたユーザーは誰でも参加者情報を閲覧可能
CREATE POLICY "select_group_chat_participants"
ON sasaeai_group_chat_participants
FOR SELECT
TO authenticated
USING (true);

-- INSERT: 認証されたユーザーは自分自身を参加者として追加可能
CREATE POLICY "insert_group_chat_participants"
ON sasaeai_group_chat_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- DELETE: ユーザーは自分自身の参加情報のみ削除可能
CREATE POLICY "delete_group_chat_participants"
ON sasaeai_group_chat_participants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- メッセージテーブルのポリシーも確認
DROP POLICY IF EXISTS "select_group_chat_messages" ON sasaeai_group_chat_messages;
DROP POLICY IF EXISTS "insert_group_chat_messages" ON sasaeai_group_chat_messages;

-- SELECT: 認証されたユーザーは誰でもメッセージを閲覧可能
CREATE POLICY "select_group_chat_messages"
ON sasaeai_group_chat_messages
FOR SELECT
TO authenticated
USING (true);

-- INSERT: 認証されたユーザーは自分のメッセージを投稿可能
CREATE POLICY "insert_group_chat_messages"
ON sasaeai_group_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);
