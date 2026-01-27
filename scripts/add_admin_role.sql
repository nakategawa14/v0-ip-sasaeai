-- 管理者フラグを追加
ALTER TABLE sasaeai_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON sasaeai_profiles(is_admin);

-- nurekoinu-shop1@yahoo.co.jp を管理者に設定
UPDATE sasaeai_profiles
SET is_admin = TRUE
WHERE email = 'nurekoinu-shop1@yahoo.co.jp';

-- 確認用クエリ（管理者一覧を表示）
SELECT email, nickname, is_admin FROM sasaeai_profiles WHERE is_admin = TRUE;
