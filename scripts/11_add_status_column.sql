-- ステータスカラムの追加

ALTER TABLE sasaeai_group_chat_rooms
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('active', 'scheduled', 'closed'));

-- 既存のis_activeとの整合性を保つ
UPDATE sasaeai_group_chat_rooms
SET status = CASE
  WHEN is_active = TRUE THEN 'active'
  ELSE 'closed'
END
WHERE status IS NULL;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_group_chat_rooms_status ON sasaeai_group_chat_rooms(status);
