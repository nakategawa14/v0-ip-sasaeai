-- ライブテキストチャット枠機能の追加

-- グループチャットルームテーブルにカラム追加
ALTER TABLE sasaeai_group_chat_rooms
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- categoryのインデックス追加
CREATE INDEX IF NOT EXISTS idx_group_chat_rooms_category ON sasaeai_group_chat_rooms(category);
CREATE INDEX IF NOT EXISTS idx_group_chat_rooms_scheduled_start ON sasaeai_group_chat_rooms(scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_group_chat_rooms_is_official ON sasaeai_group_chat_rooms(is_official);

-- host_idを既存のcreated_byと同期
UPDATE sasaeai_group_chat_rooms
SET host_id = created_by
WHERE host_id IS NULL;

-- カテゴリーのCHECK制約追加
ALTER TABLE sasaeai_group_chat_rooms
ADD CONSTRAINT check_category_valid
CHECK (category IN (
  'general',          -- 雑談
  'disability',       -- 障がいについて
  'health',           -- 健康・病気
  'welfare',          -- 福祉・制度
  'work',             -- 仕事・就労
  'daily_life',       -- 日常生活
  'relationship',     -- 恋愛・人間関係
  'regional',         -- 地域別
  'other'             -- その他
) OR category IS NULL);

-- 管理者用の公式ルーム作成ポリシー更新
DROP POLICY IF EXISTS "Group chat rooms can be created by women and paid men" ON sasaeai_group_chat_rooms;

CREATE POLICY "Group chat rooms can be created by women, paid men, and admins"
  ON sasaeai_group_chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid()
      AND (
        gender = 'female' 
        OR membership_status = 'paid'
        OR is_admin = TRUE
      )
    )
  );

-- 公式ルームの例を作成
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- 管理者ユーザーIDを取得
  SELECT id INTO admin_user_id
  FROM sasaeai_profiles
  WHERE is_admin = TRUE
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- 既存のルームを削除
    DELETE FROM sasaeai_group_chat_rooms WHERE is_official = TRUE;

    -- 公式ルームを作成
    INSERT INTO sasaeai_group_chat_rooms (name, description, category, created_by, host_id, is_official, max_participants)
    VALUES
      ('みんなの雑談ルーム', '自由に雑談できる公式ルームです。気軽にお話ししましょう。', 'general', admin_user_id, admin_user_id, TRUE, 100),
      ('障害年金について', '障害年金の申請、更新、金額などについて情報交換しましょう。', 'welfare', admin_user_id, admin_user_id, TRUE, 50),
      ('就労支援・仕事の話', '就労移行支援、就労継続支援、一般就労についての情報共有。', 'work', admin_user_id, admin_user_id, TRUE, 50),
      ('恋愛相談ルーム', '恋愛の悩み、マッチングのコツなどを相談できます。', 'relationship', admin_user_id, admin_user_id, TRUE, 30),
      ('病気・健康管理', '病気の症状、治療、日々の健康管理について語り合いましょう。', 'health', admin_user_id, admin_user_id, TRUE, 50);
  END IF;
END $$;

-- 定員オーバーチェック関数
CREATE OR REPLACE FUNCTION check_room_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  -- 現在の参加者数と定員を取得
  SELECT participant_count, max_participants
  INTO current_count, max_count
  FROM sasaeai_group_chat_rooms
  WHERE id = NEW.room_id;

  -- 定員をオーバーしている場合はエラー
  IF current_count >= max_count THEN
    RAISE EXCEPTION 'このルームは定員に達しています';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 参加時に定員チェックするトリガー
CREATE TRIGGER check_room_capacity_trigger
BEFORE INSERT ON sasaeai_group_chat_participants
FOR EACH ROW
EXECUTE FUNCTION check_room_capacity();

-- 時間指定ルームの自動クローズ関数
CREATE OR REPLACE FUNCTION close_scheduled_rooms()
RETURNS void AS $$
BEGIN
  -- 終了時間を過ぎたルームを非アクティブ化
  UPDATE sasaeai_group_chat_rooms
  SET is_active = FALSE
  WHERE scheduled_end_time IS NOT NULL
  AND scheduled_end_time < NOW()
  AND is_active = TRUE
  AND is_official = FALSE; -- 公式ルームは自動クローズしない
END;
$$ LANGUAGE plpgsql;
