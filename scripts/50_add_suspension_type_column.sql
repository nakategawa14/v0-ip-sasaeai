-- sasaeai_suspensionsテーブルにtypeカラムを追加

-- suspension_typeカラムを追加（既に存在する場合はスキップ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sasaeai_suspensions' AND column_name = 'suspension_type'
  ) THEN
    ALTER TABLE sasaeai_suspensions ADD COLUMN suspension_type text DEFAULT 'temporary';
  END IF;
END $$;

-- 既存のレコードを更新（expires_atがnullなら永久BAN、それ以外は一時停止）
UPDATE sasaeai_suspensions
SET suspension_type = CASE 
  WHEN expires_at IS NULL THEN 'permanent'
  ELSE 'temporary'
END
WHERE suspension_type IS NULL;

-- 確認
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'sasaeai_suspensions' AND column_name = 'suspension_type';
