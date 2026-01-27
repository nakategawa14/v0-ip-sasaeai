-- 不足しているプロフィールカラムを追加

ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS anxiety_disorder TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS mood_disorder TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS developmental_disorder TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS intellectual_disability_details TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS mobility_impairment TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS visual_impairment TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS hearing_impairment TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS speech_impairment TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS internal_disability TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS neurological_disease TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS immune_disease TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS metabolic_disease TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS cardiovascular_disease TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS respiratory_disease TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS blood_disease TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS non_designated_disease TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS welfare_equipment_details TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS annual_income TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS living_situation TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS family_relationship TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS has_children TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS independence_level TEXT;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS smokes TEXT;
