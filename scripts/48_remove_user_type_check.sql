-- user_typeカラムのCHECK制約を削除
ALTER TABLE sasaeai_profiles DROP CONSTRAINT IF EXISTS sasaeai_profiles_user_type_check;

-- 確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' AND column_name = 'user_type';
