-- プロフィール画像、本人確認画像、シークレットモードを追加

ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS id_verification_image_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_verification_image_url TEXT,
ADD COLUMN IF NOT EXISTS is_secret_mode BOOLEAN DEFAULT false;

-- コメントを追加
COMMENT ON COLUMN sasaeai_profiles.profile_image_url IS 'プロフィール画像のURL';
COMMENT ON COLUMN sasaeai_profiles.id_verification_image_url IS '本人確認書類（免許証など）の画像URL';
COMMENT ON COLUMN sasaeai_profiles.selfie_verification_image_url IS '自撮り本人確認画像のURL';
COMMENT ON COLUMN sasaeai_profiles.is_secret_mode IS 'シークレットモード（検索結果に出ない）';
