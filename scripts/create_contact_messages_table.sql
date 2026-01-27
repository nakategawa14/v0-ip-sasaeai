-- 運営への問い合わせメッセージテーブル
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- RLS有効化
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のメッセージのみ閲覧可能
CREATE POLICY "Users can view their own messages"
  ON contact_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のメッセージを作成可能
CREATE POLICY "Users can create their own messages"
  ON contact_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE contact_messages IS '運営への問い合わせメッセージ';
COMMENT ON COLUMN contact_messages.status IS 'メッセージのステータス: new, in_progress, resolved';
