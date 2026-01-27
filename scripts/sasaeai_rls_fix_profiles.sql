-- RLSポリシーの修正: ユーザーがプロフィールを作成・更新できるようにする
-- 実際のテーブル構造に合わせて修正

-- 実際に存在するテーブルのみにRLSを有効化
ALTER TABLE sasaeai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_profile_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_profile_tags ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can insert own profile" ON sasaeai_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON sasaeai_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON sasaeai_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON sasaeai_profiles;

-- sasaeai_profilesテーブル: idカラムを使用（主キー）
CREATE POLICY "Users can insert own profile" ON sasaeai_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON sasaeai_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON sasaeai_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable" ON sasaeai_profiles
  FOR SELECT
  USING (is_active = true);

-- sasaeai_profile_detailsテーブル: profile_idカラムを使用
DROP POLICY IF EXISTS "Users can insert own details" ON sasaeai_profile_details;
DROP POLICY IF EXISTS "Users can update own details" ON sasaeai_profile_details;
DROP POLICY IF EXISTS "Users can view own details" ON sasaeai_profile_details;

CREATE POLICY "Users can insert own details" ON sasaeai_profile_details
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own details" ON sasaeai_profile_details
  FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can view own details" ON sasaeai_profile_details
  FOR SELECT
  USING (profile_id = auth.uid());

-- sasaeai_profile_tagsテーブル: profile_idカラムを使用
DROP POLICY IF EXISTS "Users can insert own tags" ON sasaeai_profile_tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON sasaeai_profile_tags;
DROP POLICY IF EXISTS "Users can view tags" ON sasaeai_profile_tags;

CREATE POLICY "Users can insert own tags" ON sasaeai_profile_tags
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own tags" ON sasaeai_profile_tags
  FOR DELETE
  USING (profile_id = auth.uid());

CREATE POLICY "Users can view tags" ON sasaeai_profile_tags
  FOR SELECT
  USING (true);

-- 完了メッセージ
SELECT 'RLSポリシーの設定が完了しました' AS status;
