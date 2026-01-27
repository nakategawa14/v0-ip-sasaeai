-- annual_incomeカラムのCHECK制約を削除
-- フォームから送信される値がCHECK制約に合わない場合があるため

-- 既存のCHECK制約を削除
ALTER TABLE sasaeai_profiles DROP CONSTRAINT IF EXISTS sasaeai_profiles_annual_income_check;

-- 確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' AND column_name = 'annual_income';
