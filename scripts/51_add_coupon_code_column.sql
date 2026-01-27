-- sasaeai_profilesテーブルにcoupon_codeカラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- 確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' 
AND column_name = 'coupon_code';
