-- あなたのユーザーを管理者に設定
UPDATE sasaeai_profiles 
SET is_admin = true 
WHERE email = 'nurekoinu-shop1@yahoo.co.jp';

-- 確認
SELECT id, email, nickname, is_admin 
FROM sasaeai_profiles 
WHERE email = 'nurekoinu-shop1@yahoo.co.jp';
