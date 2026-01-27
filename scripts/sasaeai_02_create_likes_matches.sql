-- いいねテーブル
CREATE TABLE IF NOT EXISTS sasaeai_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- マッチングテーブル
CREATE TABLE IF NOT EXISTS sasaeai_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user1_id, user2_id)
);

-- ブロックテーブル
CREATE TABLE IF NOT EXISTS sasaeai_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_likes_from_user ON sasaeai_likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_to_user ON sasaeai_likes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON sasaeai_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON sasaeai_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON sasaeai_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON sasaeai_blocks(blocked_id);

-- RLS (Row Level Security) 有効化
ALTER TABLE sasaeai_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_blocks ENABLE ROW LEVEL SECURITY;

-- いいねテーブルのRLSポリシー
CREATE POLICY "Users can view likes they sent or received" ON sasaeai_likes
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can insert their own likes" ON sasaeai_likes
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete their own likes" ON sasaeai_likes
  FOR DELETE USING (auth.uid() = from_user_id);

-- マッチングテーブルのRLSポリシー
CREATE POLICY "Users can view their own matches" ON sasaeai_matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can insert matches" ON sasaeai_matches
  FOR INSERT WITH CHECK (true);

-- ブロックテーブルのRLSポリシー
CREATE POLICY "Users can view blocks they created" ON sasaeai_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks" ON sasaeai_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks" ON sasaeai_blocks
  FOR DELETE USING (auth.uid() = blocker_id);
