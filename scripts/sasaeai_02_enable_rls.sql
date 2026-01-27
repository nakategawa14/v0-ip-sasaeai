-- ささえ愛専用テーブルのRow Level Security (RLS)

-- プロフィールテーブルのRLS
ALTER TABLE sasaeai_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sasaeai_ユーザーは自分のプロフィールを閲覧可能"
  ON sasaeai_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "sasaeai_ユーザーは自分のプロフィールを更新可能"
  ON sasaeai_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "sasaeai_すべてのユーザーは他のプロフィールを閲覧可能"
  ON sasaeai_profiles FOR SELECT
  USING (is_active = true AND is_suspended = false);

-- プロフィールタグのRLS
ALTER TABLE sasaeai_profile_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sasaeai_ユーザーは自分のタグを管理可能"
  ON sasaeai_profile_tags FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "sasaeai_すべてのユーザーはタグを閲覧可能"
  ON sasaeai_profile_tags FOR SELECT
  USING (true);

-- プロフィール写真のRLS
ALTER TABLE sasaeai_profile_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sasaeai_ユーザーは自分の写真を管理可能"
  ON sasaeai_profile_photos FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "sasaeai_すべてのユーザーは写真を閲覧可能"
  ON sasaeai_profile_photos FOR SELECT
  USING (true);

-- いいねのRLS
ALTER TABLE sasaeai_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sasaeai_ユーザーは自分のいいねを管理可能"
  ON sasaeai_likes FOR ALL
  USING (auth.uid() = from_user_id);

CREATE POLICY "sasaeai_ユーザーは受け取ったいいねを閲覧可能"
  ON sasaeai_likes FOR SELECT
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- マッチングのRLS
ALTER TABLE sasaeai_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sasaeai_ユーザーは自分のマッチを閲覧可能"
  ON sasaeai_matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- メッセージのRLS
ALTER TABLE sasaeai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sasaeai_有料会員のみメッセージ送信可能"
  ON sasaeai_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid()
      AND membership_status = 'premium'
      AND membership_expires_at > NOW()
    )
  );

CREATE POLICY "sasaeai_ユーザーは自分のメッセージを閲覧可能"
  ON sasaeai_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "sasaeai_ユーザーは受信メッセージを既読にできる"
  ON sasaeai_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- 決済履歴のRLS
ALTER TABLE sasaeai_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sasaeai_ユーザーは自分の決済履歴を閲覧可能"
  ON sasaeai_payments FOR SELECT
  USING (auth.uid() = user_id);

-- ブロックのRLS
ALTER TABLE sasaeai_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sasaeai_ユーザーは自分のブロックリストを管理可能"
  ON sasaeai_blocks FOR ALL
  USING (auth.uid() = blocker_id);

-- 通報のRLS
ALTER TABLE sasaeai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sasaeai_ユーザーは通報を作成可能"
  ON sasaeai_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "sasaeai_ユーザーは自分の通報を閲覧可能"
  ON sasaeai_reports FOR SELECT
  USING (auth.uid() = reporter_id);
