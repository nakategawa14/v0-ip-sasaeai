-- sasaeai_profilesテーブルにother_illnessカラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS other_illness TEXT;

-- 確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' 
AND column_name IN ('chronic_illness', 'other_illness');
