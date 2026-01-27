-- ささえ愛専用の便利な関数

-- プロフィール更新時にupdated_atを自動更新
CREATE OR REPLACE FUNCTION sasaeai_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sasaeai_update_profiles_updated_at
  BEFORE UPDATE ON sasaeai_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sasaeai_update_updated_at_column();

-- 相互いいねでマッチング自動作成
CREATE OR REPLACE FUNCTION sasaeai_create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM sasaeai_likes
    WHERE from_user_id = NEW.to_user_id
    AND to_user_id = NEW.from_user_id
  ) THEN
    INSERT INTO sasaeai_matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.from_user_id, NEW.to_user_id),
      GREATEST(NEW.from_user_id, NEW.to_user_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sasaeai_create_match_on_like
  AFTER INSERT ON sasaeai_likes
  FOR EACH ROW
  EXECUTE FUNCTION sasaeai_create_match_on_mutual_like();

-- 会員資格チェック関数
CREATE OR REPLACE FUNCTION sasaeai_check_membership_status(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM sasaeai_profiles
    WHERE id = user_id
    AND membership_status = 'premium'
    AND membership_expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- メッセージ既読処理
CREATE OR REPLACE FUNCTION sasaeai_mark_message_as_read(message_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sasaeai_messages
  SET is_read = true, read_at = NOW()
  WHERE id = message_id
  AND receiver_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ユーザー統計取得関数
CREATE OR REPLACE FUNCTION sasaeai_get_user_stats()
RETURNS TABLE(
  total_users BIGINT,
  active_users BIGINT,
  premium_users BIGINT,
  free_users BIGINT,
  suspended_users BIGINT,
  users_with_disability BIGINT,
  supporters BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_users,
    COUNT(CASE WHEN is_active = true AND is_suspended = false THEN 1 END)::BIGINT as active_users,
    COUNT(CASE WHEN membership_status = 'premium' THEN 1 END)::BIGINT as premium_users,
    COUNT(CASE WHEN membership_status = 'free' THEN 1 END)::BIGINT as free_users,
    COUNT(CASE WHEN is_suspended = true THEN 1 END)::BIGINT as suspended_users,
    COUNT(CASE WHEN has_disability = true THEN 1 END)::BIGINT as users_with_disability,
    COUNT(CASE WHEN is_supporter = true THEN 1 END)::BIGINT as supporters
  FROM sasaeai_profiles;
END;
$$ LANGUAGE plpgsql;
