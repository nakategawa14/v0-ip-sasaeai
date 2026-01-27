-- sasaeai_matchesテーブルに外部キー制約を追加し、既存の相互いいねからマッチを作成

-- 1. 外部キー制約を追加
ALTER TABLE sasaeai_matches
DROP CONSTRAINT IF EXISTS fk_matches_user1,
DROP CONSTRAINT IF EXISTS fk_matches_user2;

ALTER TABLE sasaeai_matches
ADD CONSTRAINT fk_matches_user1 
  FOREIGN KEY (user1_id) REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_matches_user2 
  FOREIGN KEY (user2_id) REFERENCES sasaeai_profiles(id) ON DELETE CASCADE;

-- 2. 既存の相互いいねからマッチを作成
INSERT INTO sasaeai_matches (user1_id, user2_id, matched_at, is_active)
SELECT 
  CASE WHEN l1.user_id < l1.target_user_id THEN l1.user_id ELSE l1.target_user_id END as user1_id,
  CASE WHEN l1.user_id < l1.target_user_id THEN l1.target_user_id ELSE l1.user_id END as user2_id,
  GREATEST(l1.created_at, l2.created_at) as matched_at,
  true as is_active
FROM sasaeai_likes l1
JOIN sasaeai_likes l2 ON l1.user_id = l2.target_user_id AND l1.target_user_id = l2.user_id
WHERE l1.user_id < l1.target_user_id
ON CONFLICT (user1_id, user2_id) DO NOTHING;

-- 3. 結果を確認
SELECT 
  m.id,
  p1.nickname as user1_name,
  p2.nickname as user2_name,
  m.matched_at,
  m.is_active
FROM sasaeai_matches m
JOIN sasaeai_profiles p1 ON m.user1_id = p1.id
JOIN sasaeai_profiles p2 ON m.user2_id = p2.id
ORDER BY m.matched_at DESC;
