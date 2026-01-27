-- sasaeai_profilesテーブルにmembership_started_atカラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS membership_started_at TIMESTAMPTZ;

-- 追加されたカラムを確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' 
AND column_name = 'membership_started_at';
