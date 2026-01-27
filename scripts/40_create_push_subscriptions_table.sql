-- プッシュ通知購読情報テーブルを作成

-- 既存のテーブル、ポリシー、インデックスを削除
DROP POLICY IF EXISTS "Users can view own subscriptions" ON sasaeai_push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON sasaeai_push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON sasaeai_push_subscriptions;
DROP INDEX IF EXISTS idx_push_subscriptions_user_id;
DROP INDEX IF EXISTS idx_push_subscriptions_endpoint;
DROP TABLE IF EXISTS sasaeai_push_subscriptions;

-- テーブル作成
CREATE TABLE sasaeai_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- RLS有効化
ALTER TABLE sasaeai_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can view own subscriptions"
  ON sasaeai_push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON sasaeai_push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON sasaeai_push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- サービスロール用のポリシー（プッシュ通知送信時に使用）
CREATE POLICY "Service role can view all subscriptions"
  ON sasaeai_push_subscriptions FOR SELECT
  TO service_role
  USING (true);

-- インデックス
CREATE INDEX idx_push_subscriptions_user_id ON sasaeai_push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON sasaeai_push_subscriptions(endpoint);

-- 確認
SELECT 
  'sasaeai_push_subscriptions' as table_name,
  (SELECT COUNT(*) FROM sasaeai_push_subscriptions) as row_count;
