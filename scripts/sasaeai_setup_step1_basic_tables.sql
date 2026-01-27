-- ささえ愛: 基本テーブル作成（ステップ1）
-- 既存のぽちゃマッチプロジェクトで実行
-- このスクリプトは基本的なテーブルのみを作成します

-- 1. プロフィールテーブル
CREATE TABLE IF NOT EXISTS public.sasaeai_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  birth_date DATE NOT NULL,
  prefecture TEXT NOT NULL,
  city TEXT,
  bio TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('person_with_disability', 'chronic_illness', 'supporter')),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. プロフィール詳細テーブル
CREATE TABLE IF NOT EXISTS public.sasaeai_profile_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  height INTEGER,
  body_type TEXT,
  occupation TEXT,
  annual_income TEXT,
  education TEXT,
  living_situation TEXT,
  marital_status TEXT,
  has_children TEXT,
  want_children TEXT,
  smoking TEXT,
  drinking TEXT,
  disability_type TEXT,
  disability_details TEXT,
  chronic_illness_type TEXT,
  chronic_illness_details TEXT,
  support_experience TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- 3. プロフィールタグテーブル
CREATE TABLE IF NOT EXISTS public.sasaeai_profile_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_category TEXT NOT NULL CHECK (tag_category IN ('interest', 'disability', 'personality', 'lifestyle')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_sasaeai_profiles_user_type ON public.sasaeai_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_sasaeai_profiles_is_premium ON public.sasaeai_profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_sasaeai_profiles_is_active ON public.sasaeai_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_sasaeai_profile_tags_profile_id ON public.sasaeai_profile_tags(profile_id);
CREATE INDEX IF NOT EXISTS idx_sasaeai_profile_tags_tag_category ON public.sasaeai_profile_tags(tag_category);

-- 完了メッセージ
SELECT 'ささえ愛: 基本テーブル作成完了' AS status;
