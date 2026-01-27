-- ささえ愛専用のサンプルクーポンコード

-- ミライロIDクーポン（50%オフ）
INSERT INTO sasaeai_coupon_codes (code, discount_type, discount_value, max_uses, is_active)
VALUES ('MIRAIRO2024', 'percentage', 50, 10000, true);

-- 初回登録キャンペーン（300円オフ）
INSERT INTO sasaeai_coupon_codes (code, discount_type, discount_value, max_uses, valid_until, is_active)
VALUES ('WELCOME300', 'fixed_amount', 300, 500, '2024-12-31 23:59:59', true);

-- 友達紹介キャンペーン（200円オフ）
INSERT INTO sasaeai_coupon_codes (code, discount_type, discount_value, max_uses, is_active)
VALUES ('FRIEND200', 'fixed_amount', 200, 1000, true);
