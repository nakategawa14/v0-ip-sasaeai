-- 便利な関数を作成

-- プロフィール更新時にupdated_atを自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 相互いいねでマッチング自動作成
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- 相手からもいいねがあるかチェック
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE from_user_id = NEW.to_user_id
    AND to_user_id = NEW.from_user_id
  ) THEN
    -- マッチング作成（既に存在しない場合）
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.from_user_id, NEW.to_user_id),
      GREATEST(NEW.from_user_id, NEW.to_user_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_match_on_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- 会員資格チェック関数
CREATE OR REPLACE FUNCTION check_membership_status(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND membership_status = 'premium'
    AND membership_expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- メッセージ既読処理
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET is_read = true, read_at = NOW()
  WHERE id = message_id
  AND receiver_id = user_id;
END;
$$ LANGUAGE plpgsql;
