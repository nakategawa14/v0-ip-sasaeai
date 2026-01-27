-- プロフィール訪問履歴テーブル
CREATE TABLE IF NOT EXISTS sasaeai_profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_users CHECK (viewer_id != viewed_profile_id)
);

-- インデックスにIF NOT EXISTSを追加
-- インデックス
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON sasaeai_profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON sasaeai_profile_views(viewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON sasaeai_profile_views(viewed_at);

-- RLS ポリシー
ALTER TABLE sasaeai_profile_views ENABLE ROW LEVEL SECURITY;

-- ポリシーが既に存在する場合はスキップ
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sasaeai_profile_views' 
    AND policyname = 'Users can view their own visit history'
  ) THEN
    CREATE POLICY "Users can view their own visit history"
      ON sasaeai_profile_views
      FOR SELECT
      USING (
        auth.uid() = viewer_id OR 
        auth.uid() = viewed_profile_id
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sasaeai_profile_views' 
    AND policyname = 'Authenticated users can create profile views'
  ) THEN
    CREATE POLICY "Authenticated users can create profile views"
      ON sasaeai_profile_views
      FOR INSERT
      WITH CHECK (auth.uid() = viewer_id);
  END IF;
END $$;

-- メール配信履歴テーブル
CREATE TABLE IF NOT EXISTS sasaeai_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  error_message TEXT
);

-- インデックスにIF NOT EXISTSを追加
-- インデックス
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON sasaeai_email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON sasaeai_email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON sasaeai_email_logs(sent_at);

-- RLS ポリシー（管理者のみ閲覧可能）
ALTER TABLE sasaeai_email_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sasaeai_email_logs' 
    AND policyname = 'Only admins can view email logs'
  ) THEN
    -- roleカラムをis_adminカラムに変更
    CREATE POLICY "Only admins can view email logs"
      ON sasaeai_email_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM sasaeai_profiles
          WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;

-- メール配信設定テーブル
CREATE TABLE IF NOT EXISTS sasaeai_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  receive_profile_visitor_emails BOOLEAN NOT NULL DEFAULT true,
  receive_match_notification_emails BOOLEAN NOT NULL DEFAULT true,
  receive_weekly_digest_emails BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックスにIF NOT EXISTSを追加
-- インデックス
CREATE INDEX IF NOT EXISTS idx_email_settings_user ON sasaeai_email_settings(user_id);

-- RLS ポリシー
ALTER TABLE sasaeai_email_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sasaeai_email_settings' 
    AND policyname = 'Users can view their own email settings'
  ) THEN
    CREATE POLICY "Users can view their own email settings"
      ON sasaeai_email_settings
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sasaeai_email_settings' 
    AND policyname = 'Users can update their own email settings'
  ) THEN
    CREATE POLICY "Users can update their own email settings"
      ON sasaeai_email_settings
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sasaeai_email_settings' 
    AND policyname = 'Users can insert their own email settings'
  ) THEN
    CREATE POLICY "Users can insert their own email settings"
      ON sasaeai_email_settings
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
