-- sasaeai_profilesテーブルにdiscounted_priceカラムを追加
ALTER TABLE sasaeai_profiles 
ADD COLUMN IF NOT EXISTS discounted_price INTEGER DEFAULT NULL;

-- 確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' 
AND column_name = 'discounted_price';
