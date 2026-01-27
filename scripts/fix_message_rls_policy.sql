-- メッセージRLSポリシーを修正
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view messages in their matches" ON sasaeai_messages;
DROP POLICY IF EXISTS "Users can insert messages in their matches" ON sasaeai_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON sasaeai_messages;
DROP POLICY IF EXISTS "Users can update messages as read" ON sasaeai_messages;

-- 新しいポリシーを作成（よりシンプルで確実に動作するもの）

-- RLSポリシー: マッチング相手同士のみメッセージを閲覧可能
CREATE POLICY "Users can view messages in their matches" ON sasaeai_messages
  FOR SELECT USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM sasaeai_matches
      WHERE sasaeai_matches.id = sasaeai_messages.match_id
      AND sasaeai_matches.is_active = true
      AND (sasaeai_matches.user1_id = auth.uid() OR sasaeai_matches.user2_id = auth.uid())
    )
  );

-- RLSポリシー: マッチング相手同士のみメッセージを送信可能（シンプル版）
CREATE POLICY "Users can insert messages in their matches" ON sasaeai_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM sasaeai_matches
      WHERE sasaeai_matches.id = match_id
      AND sasaeai_matches.is_active = true
      AND (sasaeai_matches.user1_id = auth.uid() OR sasaeai_matches.user2_id = auth.uid())
    )
  );

-- RLSポリシー: 自分が送信したメッセージのみ削除可能
CREATE POLICY "Users can delete their own messages" ON sasaeai_messages
  FOR DELETE USING (sender_id = auth.uid());

-- RLSポリシー: マッチング相手のメッセージを既読にできる
CREATE POLICY "Users can update messages as read" ON sasaeai_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sasaeai_matches
      WHERE sasaeai_matches.id = match_id
      AND sasaeai_matches.is_active = true
      AND (
        (sasaeai_matches.user1_id = auth.uid() AND sender_id = sasaeai_matches.user2_id)
        OR (sasaeai_matches.user2_id = auth.uid() AND sender_id = sasaeai_matches.user1_id)
      )
    )
  )
  WITH CHECK (is_read = true); -- 既読フラグのみ更新可能
