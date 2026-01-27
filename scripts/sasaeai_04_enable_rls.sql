-- ささえ愛: Row Level Security (RLS) 有効化
-- 全てのテーブルにセキュリティポリシーを設定します

-- 1. プロフィールテーブルのRLS
ALTER TABLE public.sasaeai_profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールは読み書き可能
CREATE POLICY "Users can view their own profile"
  ON public.sasaeai_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.sasaeai_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.sasaeai_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- アクティブなプロフィールは全員が閲覧可能
CREATE POLICY "Active profiles are viewable by everyone"
  ON public.sasaeai_profiles FOR SELECT
  USING (is_active = TRUE);

-- 2. プロフィール詳細テーブルのRLS
ALTER TABLE public.sasaeai_profile_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile details"
  ON public.sasaeai_profile_details FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "Profile details viewable by all"
  ON public.sasaeai_profile_details FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sasaeai_profiles
    WHERE id = profile_id AND is_active = TRUE
  ));

-- 3. プロフィールタグのRLS
ALTER TABLE public.sasaeai_profile_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tags"
  ON public.sasaeai_profile_tags FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "Tags viewable by all"
  ON public.sasaeai_profile_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sasaeai_profiles
    WHERE id = profile_id AND is_active = TRUE
  ));

-- 4. いいねテーブルのRLS
ALTER TABLE public.sasaeai_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes they sent or received"
  ON public.sasaeai_likes FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send likes"
  ON public.sasaeai_likes FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.sasaeai_likes FOR DELETE
  USING (auth.uid() = from_user_id);

-- 5. マッチテーブルのRLS
ALTER TABLE public.sasaeai_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches"
  ON public.sasaeai_matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create matches"
  ON public.sasaeai_matches FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can update their own matches"
  ON public.sasaeai_matches FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 6. メッセージテーブルのRLS
ALTER TABLE public.sasaeai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their matches"
  ON public.sasaeai_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sasaeai_matches
    WHERE id = match_id
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  ));

CREATE POLICY "Premium users can send messages"
  ON public.sasaeai_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.sasaeai_profiles
      WHERE id = auth.uid()
      AND is_premium = TRUE
      AND (premium_until IS NULL OR premium_until > NOW())
    )
  );

CREATE POLICY "Users can update their sent messages"
  ON public.sasaeai_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- 7. ブロックテーブルのRLS
ALTER TABLE public.sasaeai_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
  ON public.sasaeai_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON public.sasaeai_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON public.sasaeai_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- 8. サブスクリプションテーブルのRLS
ALTER TABLE public.sasaeai_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.sasaeai_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subscriptions"
  ON public.sasaeai_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- 9. クーポンコードテーブルのRLS
ALTER TABLE public.sasaeai_coupon_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active coupons viewable by all"
  ON public.sasaeai_coupon_codes FOR SELECT
  USING (is_active = TRUE AND NOW() BETWEEN valid_from AND valid_until);

-- 10. クーポン使用履歴のRLS
ALTER TABLE public.sasaeai_coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coupon usage"
  ON public.sasaeai_coupon_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create coupon usage"
  ON public.sasaeai_coupon_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 11. 通報テーブルのRLS
ALTER TABLE public.sasaeai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON public.sasaeai_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON public.sasaeai_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- 完了メッセージ
SELECT 'ささえ愛: RLS設定完了' AS status;
