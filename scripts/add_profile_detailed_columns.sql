-- プロフィールテーブルに詳細情報カラムを追加
-- 既存のnickname, bio, profile_imagesカラムは維持

-- 基本情報カラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS prefecture TEXT,
ADD COLUMN IF NOT EXISTS hometown TEXT;

-- 障がい情報カラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('person_with_disability', 'supporter')) DEFAULT 'person_with_disability',
ADD COLUMN IF NOT EXISTS has_disability BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS disability_type TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS disability_details TEXT,
ADD COLUMN IF NOT EXISTS can_go_out_alone BOOLEAN,
ADD COLUMN IF NOT EXISTS chronic_illness TEXT;

-- 就労情報カラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'self_employed', 'unemployed', 'student', 'retired', 'other')),
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS annual_income TEXT CHECK (annual_income IN ('under_2m', '2m_4m', '4m_6m', '6m_8m', '8m_10m', 'over_10m', 'prefer_not_to_say'));

-- 生活情報カラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS living_situation TEXT CHECK (living_situation IN ('alone', 'with_family', 'with_partner', 'group_home', 'facility', 'other')),
ADD COLUMN IF NOT EXISTS family_relationship TEXT;

-- サポーター情報カラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS supporter_message TEXT;

-- その他カラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS membership_status TEXT CHECK (membership_status IN ('free', 'premium')) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- インデックスを追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON sasaeai_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_prefecture ON sasaeai_profiles(prefecture);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON sasaeai_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_status ON sasaeai_profiles(membership_status);

-- 既存のデータにデフォルト値を設定
UPDATE sasaeai_profiles
SET 
  user_type = COALESCE(user_type, 'person_with_disability'),
  has_disability = COALESCE(has_disability, false),
  membership_status = COALESCE(membership_status, 'free'),
  last_active_at = COALESCE(last_active_at, now())
WHERE user_type IS NULL OR has_disability IS NULL OR membership_status IS NULL OR last_active_at IS NULL;
