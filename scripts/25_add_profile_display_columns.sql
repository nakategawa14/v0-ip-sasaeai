-- プロフィール表示に必要なカラムを追加
-- height, body_type, mbti, purpose, favorite_areas, hometown

-- カラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS body_type TEXT,
ADD COLUMN IF NOT EXISTS mbti TEXT,
ADD COLUMN IF NOT EXISTS purpose TEXT[],
ADD COLUMN IF NOT EXISTS favorite_areas TEXT,
ADD COLUMN IF NOT EXISTS hometown TEXT;

-- body_typeのCHECK制約を追加
ALTER TABLE sasaeai_profiles
DROP CONSTRAINT IF EXISTS sasaeai_profiles_body_type_check;

ALTER TABLE sasaeai_profiles
ADD CONSTRAINT sasaeai_profiles_body_type_check
CHECK (body_type IS NULL OR body_type IN ('slim', 'normal', 'muscular', 'chubby', 'large'));

-- mbtiのCHECK制約を追加
ALTER TABLE sasaeai_profiles
DROP CONSTRAINT IF EXISTS sasaeai_profiles_mbti_check;

ALTER TABLE sasaeai_profiles
ADD CONSTRAINT sasaeai_profiles_mbti_check
CHECK (mbti IS NULL OR mbti IN (
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
));

-- 確認
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' 
AND column_name IN ('height', 'body_type', 'mbti', 'purpose', 'favorite_areas', 'hometown')
ORDER BY column_name;
