-- marital_statusカラムを追加
-- 婚姻状況フィールド

-- marital_statusカラムを追加
ALTER TABLE sasaeai_profiles 
ADD COLUMN IF NOT EXISTS marital_status TEXT;

-- 確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' 
AND column_name = 'marital_status';
