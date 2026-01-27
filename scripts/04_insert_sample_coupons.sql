-- サンプルクーポンコードの挿入

-- ミライロIDクーポン（50%割引）
INSERT INTO coupon_codes (code, discount_type, discount_value, max_uses, is_active)
VALUES ('MIRAIRO2025', 'percentage', 50, NULL, true);

-- 初回限定クーポン（30%割引）
INSERT INTO coupon_codes (code, discount_type, discount_value, max_uses, valid_until, is_active)
VALUES ('FIRST30', 'percentage', 30, 100, '2025-12-31 23:59:59', true);

-- 友達紹介クーポン（500円割引）
INSERT INTO coupon_codes (code, discount_type, discount_value, max_uses, is_active)
VALUES ('FRIEND500', 'fixed_amount', 500, NULL, true);
