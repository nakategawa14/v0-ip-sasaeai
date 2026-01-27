-- sasaeai_matchesテーブルに外部キー制約を追加し、既存の相互いいねからマッチを作成（修正版）

-- 1. 外部キー制約を追加（既存の場合はスキップ）
DO $$
BEGIN
  -- user1_id の外部キー
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sasaeai_matches_user1_id_fkey'
  ) THEN
    ALTER TABLE sasaeai_matches 
    ADD CONSTRAINT sasaeai_matches_user1_id_fkey 
    FOREIGN KEY (user1_id) REFERENCES sasaeai_profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- user2_id の外部キー
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sasaeai_matches_user2_id_fkey'
  ) THEN
    ALTER TABLE sasaeai_matches 
    ADD CONSTRAINT sasaeai_matches_user2_id_fkey 
    FOREIGN KEY (user2_id) REFERENCES sasaeai_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. 既存の相互いいねからマッチを作成
INSERT INTO sasaeai_matches (user1_id, user2_id, is_active)
SELECT 
  LEAST(l1.from_user_id, l1.to_user_id) as user1_id,
  GREATEST(l1.from_user_id, l1.to_user_id) as user2_id,
  true as is_active
FROM sasaeai_likes l1
JOIN sasaeai_likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
WHERE l1.from_user_id < l1.to_user_id  -- 重複を防ぐ
ON CONFLICT (user1_id, user2_id) DO NOTHING;

-- 3. 作成されたマッチを確認
SELECT 
  m.id,
  m.user1_id,
  p1.nickname as user1_name,
  m.user2_id,
  p2.nickname as user2_name,
  m.matched_at,
  m.is_active
FROM sasaeai_matches m
LEFT JOIN sasaeai_profiles p1 ON m.user1_id = p1.id
LEFT JOIN sasaeai_profiles p2 ON m.user2_id = p2.id
ORDER BY m.matched_at DESC;
