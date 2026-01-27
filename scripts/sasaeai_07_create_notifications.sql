-- 通知テーブル
CREATE TABLE IF NOT EXISTS sasaeai_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'profile_view', 'like_received', 'match', 'message'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- 通知をクリックしたときの遷移先URL
  related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- 関連するユーザーID（いいねした人、メッセージ送信者など）
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON sasaeai_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON sasaeai_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON sasaeai_notifications(created_at DESC);

-- RLS（Row Level Security）
ALTER TABLE sasaeai_notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知のみ閲覧・更新可能
CREATE POLICY "Users can view their own notifications"
  ON sasaeai_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON sasaeai_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- システムが通知を作成可能（Server Actionsから）
CREATE POLICY "Service role can insert notifications"
  ON sasaeai_notifications FOR INSERT
  WITH CHECK (true);
