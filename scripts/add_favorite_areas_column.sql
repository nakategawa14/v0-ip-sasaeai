-- favorite_areasカラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS favorite_areas TEXT;

COMMENT ON COLUMN sasaeai_profiles.favorite_areas IS '遊びに行く街（カンマ区切り）';
