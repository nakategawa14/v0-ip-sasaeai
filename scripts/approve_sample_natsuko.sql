-- サンプルナツコを承認済みに設定（テスト用）
UPDATE sasaeai_profiles
SET 
  is_verified = true,
  updated_at = NOW()
WHERE nickname = 'サンプルナツコ';

-- 確認
SELECT 
  id,
  nickname,
  email,
  is_verified,
  is_active,
  is_secret
FROM sasaeai_profiles
WHERE nickname = 'サンプルナツコ';
