-- Row Level Security (RLS) の有効化

-- プロフィールテーブルのRLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のプロフィールを閲覧可能"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "ユーザーは自分のプロフィールを更新可能"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "すべてのユーザーは他のプロフィールを閲覧可能"
  ON profiles FOR SELECT
  USING (is_active = true);

-- プロフィール写真のRLS
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分の写真を管理可能"
  ON profile_photos FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "すべてのユーザーは写真を閲覧可能"
  ON profile_photos FOR SELECT
  USING (true);

-- いいねのRLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のいいねを管理可能"
  ON likes FOR ALL
  USING (auth.uid() = from_user_id);

CREATE POLICY "ユーザーは受け取ったいいねを閲覧可能"
  ON likes FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- マッチングのRLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のマッチを閲覧可能"
  ON matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- メッセージのRLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "有料会員のみメッセージ送信可能"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND membership_status = 'premium'
      AND membership_expires_at > NOW()
    )
  );

CREATE POLICY "ユーザーは自分のメッセージを閲覧可能"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "ユーザーは受信メッセージを既読にできる"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- 決済履歴のRLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分の決済履歴を閲覧可能"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- ブロックのRLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のブロックリストを管理可能"
  ON blocks FOR ALL
  USING (auth.uid() = blocker_id);

-- 通報のRLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは通報を作成可能"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "ユーザーは自分の通報を閲覧可能"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);
