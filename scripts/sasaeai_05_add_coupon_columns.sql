-- プロフィールテーブルにクーポン関連カラムを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS discounted_price INTEGER,
ADD COLUMN IF NOT EXISTS coupon_applied_at TIMESTAMPTZ;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_profiles_coupon_code ON sasaeai_profiles(coupon_code);

COMMENT ON COLUMN sasaeai_profiles.coupon_code IS '適用したクーポンコード';
COMMENT ON COLUMN sasaeai_profiles.discounted_price IS '割引後の月額料金（円）';
COMMENT ON COLUMN sasaeai_profiles.coupon_applied_at IS 'クーポン適用日時';
