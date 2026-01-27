-- プロフィール表示に必要な残りのカラムを追加
-- independence_level, can_go_out_alone, supporter_message, tags など

-- 自立度
ALTER TABLE sasaeai_profiles 
ADD COLUMN IF NOT EXISTS independence_level TEXT;

-- 一人で外出可能か
ALTER TABLE sasaeai_profiles 
ADD COLUMN IF NOT EXISTS can_go_out_alone BOOLEAN DEFAULT NULL;

-- サポーターメッセージ
ALTER TABLE sasaeai_profiles 
ADD COLUMN IF NOT EXISTS supporter_message TEXT;

-- タグ（JSON配列）
ALTER TABLE sasaeai_profiles 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- 就労状況（employment_statusとは別）
ALTER TABLE sasaeai_profiles 
ADD COLUMN IF NOT EXISTS employment_type TEXT;

-- 年収
ALTER TABLE sasaeai_profiles 
ADD COLUMN IF NOT EXISTS annual_income TEXT;

-- 追加されたカラムを確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' 
AND column_name IN ('independence_level', 'can_go_out_alone', 'supporter_message', 'tags', 'employment_type', 'annual_income')
ORDER BY column_name;
