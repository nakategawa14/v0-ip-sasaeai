-- has_childrenカラムをboolean から textに変更
-- フォームから「同居」「別居」などの選択肢が送信されるため

-- 既存のカラムを削除
ALTER TABLE sasaeai_profiles DROP COLUMN IF EXISTS has_children;

-- テキスト型として再作成
ALTER TABLE sasaeai_profiles ADD COLUMN has_children TEXT;

-- 確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sasaeai_profiles' AND column_name = 'has_children';
