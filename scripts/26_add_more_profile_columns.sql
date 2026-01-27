-- プロフィール表示に必要な追加カラムを追加
-- drinking, smoking, marriage_status, has_children, tags, preferred_gender, hangout_areas, employment_status

-- drinking（飲酒）カラムを追加
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sasaeai_profiles' AND column_name = 'drinking') THEN
    ALTER TABLE sasaeai_profiles ADD COLUMN drinking TEXT;
  END IF;
END $$;

-- smoking（喫煙）カラムを追加
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sasaeai_profiles' AND column_name = 'smoking') THEN
    ALTER TABLE sasaeai_profiles ADD COLUMN smoking TEXT;
  END IF;
END $$;

-- marriage_status（婚姻状況）カラムを追加
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sasaeai_profiles' AND column_name = 'marriage_status') THEN
    ALTER TABLE sasaeai_profiles ADD COLUMN marriage_status TEXT;
  END IF;
END $$;

-- has_children（子供の有無）カラムを追加
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sasaeai_profiles' AND column_name = 'has_children') THEN
    ALTER TABLE sasaeai_profiles ADD COLUMN has_children BOOLEAN;
  END IF;
END $$;

-- preferred_gender（希望の相手の性別）カラムを追加
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sasaeai_profiles' AND column_name = 'preferred_gender') THEN
    ALTER TABLE sasaeai_profiles ADD COLUMN preferred_gender TEXT[];
  END IF;
END $$;

-- hangout_areas（遊びに行く街）カラムを追加
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sasaeai_profiles' AND column_name = 'hangout_areas') THEN
    ALTER TABLE sasaeai_profiles ADD COLUMN hangout_areas TEXT;
  END IF;
END $$;

-- employment_status（就労状況）カラムを追加
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sasaeai_profiles' AND column_name = 'employment_status') THEN
    ALTER TABLE sasaeai_profiles ADD COLUMN employment_status TEXT;
  END IF;
END $$;

-- 追加されたカラムを確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' 
AND column_name IN ('drinking', 'smoking', 'marriage_status', 'has_children', 'preferred_gender', 'hangout_areas', 'employment_status')
ORDER BY column_name;
