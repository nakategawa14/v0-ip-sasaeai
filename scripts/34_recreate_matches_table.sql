-- sasaeai_matchesテーブルを完全に再作成
-- 既存のテーブル、インデックス、ポリシーを削除してから再作成

-- 既存のインデックスを削除
DROP INDEX IF EXISTS idx_matches_user1;
DROP INDEX IF EXISTS idx_matches_user2;
DROP INDEX IF EXISTS idx_matches_created_at;
DROP INDEX IF EXISTS idx_matches_is_active;

-- 既存のテーブルを削除（カスケードでポリシーも削除）
DROP TABLE IF EXISTS sasaeai_matches CASCADE;

-- マッチテーブルを作成
CREATE TABLE sasaeai_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- user1_id < user2_id を強制して重複を防ぐ
  CONSTRAINT matches_user_order CHECK (user1_id < user2_id),
  -- 同じユーザーペアは1つだけ
  CONSTRAINT matches_unique_pair UNIQUE (user1_id, user2_id)
);

-- インデックス作成
CREATE INDEX idx_matches_user1 ON sasaeai_matches(user1_id);
CREATE INDEX idx_matches_user2 ON sasaeai_matches(user2_id);
CREATE INDEX idx_matches_created_at ON sasaeai_matches(created_at DESC);
CREATE INDEX idx_matches_is_active ON sasaeai_matches(is_active) WHERE is_active = true;

-- RLSを有効化
ALTER TABLE sasaeai_matches ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 自分が参加しているマッチのみ閲覧可能
CREATE POLICY "ユーザーは自分のマッチを閲覧可能" ON sasaeai_matches
  FOR SELECT USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- RLSポリシー: マッチは相互いいね時にシステムが作成（認証済みユーザーが作成可能）
CREATE POLICY "認証済みユーザーはマッチを作成可能" ON sasaeai_matches
  FOR INSERT WITH CHECK (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- RLSポリシー: 自分が参加しているマッチのみ更新可能
CREATE POLICY "ユーザーは自分のマッチを更新可能" ON sasaeai_matches
  FOR UPDATE USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
  );

-- 結果確認
SELECT 
  'sasaeai_matches' as table_name,
  (SELECT COUNT(*) FROM sasaeai_matches) as row_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'sasaeai_matches') as index_count;
