-- 残りの全てのCHECK制約を削除
-- プロフィールカラムの値制限を解除

-- employment_type
ALTER TABLE sasaeai_profiles DROP CONSTRAINT IF EXISTS sasaeai_profiles_employment_type_check;

-- independence_level
ALTER TABLE sasaeai_profiles DROP CONSTRAINT IF EXISTS sasaeai_profiles_independence_level_check;

-- marital_status
ALTER TABLE sasaeai_profiles DROP CONSTRAINT IF EXISTS sasaeai_profiles_marital_status_check;

-- drinking
ALTER TABLE sasaeai_profiles DROP CONSTRAINT IF EXISTS sasaeai_profiles_drinking_check;

-- smoking
ALTER TABLE sasaeai_profiles DROP CONSTRAINT IF EXISTS sasaeai_profiles_smoking_check;

-- purpose
ALTER TABLE sasaeai_profiles DROP CONSTRAINT IF EXISTS sasaeai_profiles_purpose_check;

-- mbti
ALTER TABLE sasaeai_profiles DROP CONSTRAINT IF EXISTS sasaeai_profiles_mbti_check;

-- 確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' 
AND column_name IN ('employment_type', 'independence_level', 'marital_status', 'drinking', 'smoking', 'purpose', 'mbti')
ORDER BY column_name;
