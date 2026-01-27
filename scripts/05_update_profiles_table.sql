-- 既存のprofilesテーブルに新しいカラムを追加

-- 基本情報の拡張
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mbti TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS regional_area TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hangout_areas TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS body_type TEXT;

-- マッチング目的
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS purpose TEXT[]; -- ['友活', '恋活', '婚活']
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_gender TEXT[]; -- ['男性', '女性', 'LGBTQ当事者']

-- 精神障がい詳細
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mental_disability BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mood_disorder TEXT; -- うつ病/双極性障害
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anxiety_disorder TEXT; -- 不安障害/強迫性障害/適応障害
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS schizophrenia_spectrum BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS developmental_disorder TEXT; -- ADHD/ASD/LD
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS epilepsy BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS eating_disorder TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS addiction TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_disorder TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trauma_related TEXT; -- PTSD等
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS somatoform_disorder TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personality_disorder TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS other_mental_disorder TEXT;

-- 知的障がい詳細
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS intellectual_disability BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS intellectual_level TEXT; -- 境界知能/軽度/中度/重度/わからない
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS therapy_handbook TEXT; -- 愛の手帳/みどりの手帳等

-- 身体障がい詳細
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS physical_disability BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visual_impairment TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hearing_impairment TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance_disorder TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS speech_disorder TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mobility_impairment TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cardiac_disorder TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS renal_disorder TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS respiratory_disorder TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS other_internal_disorder TEXT;

-- 難病詳細
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rare_disease BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS neurological_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS immune_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS endocrine_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS respiratory_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS circulatory_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digestive_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS urinary_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skin_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vision_hearing_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS genetic_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS other_disease TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS non_designated_disease TEXT; -- 指定難病以外の病気
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welfare_equipment BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welfare_equipment_details TEXT;

-- 仕事・経済状況
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_status TEXT; -- 働いてる/働いてない/休んでいる/探している・訓練中
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_type TEXT; -- 就労移行支援/A型、B型事業所等
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disability_pension BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welfare_benefits BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS annual_income TEXT; -- 0～100/100～300/300～600/600以上

-- 生活状況
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS living_situation TEXT; -- ひとりで/家族、友人と/グループホーム等
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_relationship TEXT; -- 仲良し/普通/悪い/絶縁状態
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marital_status TEXT; -- 未婚/離婚/死別
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_children TEXT; -- いない/同居/別居
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS independence_level TEXT; -- 完全に自立/ほぼ自立/たまに介助が必要等
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_go_out_alone BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS drinks_alcohol BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS smokes TEXT; -- 吸う/吸わない
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gambles BOOLEAN DEFAULT false;

-- タグシステム用のテーブル
CREATE TABLE IF NOT EXISTS profile_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tag_category TEXT NOT NULL, -- 'relationship', 'interests', 'disability'
  tag_text TEXT NOT NULL,
  tag_color TEXT NOT NULL, -- 'pink', 'orange', 'yellow', 'green'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profile_tags_user ON profile_tags(user_id);
CREATE INDEX idx_profile_tags_category ON profile_tags(tag_category);
