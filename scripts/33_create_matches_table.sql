-- sasaeai_matchesテーブルを作成（既存の場合は更新）
-- マッチング機能の完成に必要なカラムを追加

-- 既存のテーブルを削除して再作成
DROP TABLE IF EXISTS sasaeai_matches CASCADE;

-- マッチングテーブルを作成
CREATE TABLE sasaeai_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- インデックス作成
CREATE INDEX idx_matches_user1 ON sasaeai_matches(user1_id);
CREATE INDEX idx_matches_user2 ON sasaeai_matches(user2_id);
CREATE INDEX idx_matches_active ON sasaeai_matches(is_active);
CREATE INDEX idx_matches_matched_at ON sasaeai_matches(matched_at DESC);

-- RLS有効化
ALTER TABLE sasaeai_matches ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成
-- ユーザーは自分が含まれるマッチを閲覧可能
CREATE POLICY "Users can view their own matches" ON sasaeai_matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 認証済みユーザーはマッチを作成可能
CREATE POLICY "Authenticated users can insert matches" ON sasaeai_matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ユーザーは自分が含まれるマッチを更新可能（last_message_at等）
CREATE POLICY "Users can update their own matches" ON sasaeai_matches
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 確認クエリ
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'sasaeai_matches'
ORDER BY ordinal_position;
