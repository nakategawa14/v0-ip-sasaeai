-- 管理者通知設定テーブルを作成
-- 管理者ごとに通知設定を保存

-- テーブル作成
CREATE TABLE IF NOT EXISTS sasaeai_admin_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  
  -- 通知頻度: 'immediate', 'daily', 'three_times_daily'
  notification_frequency TEXT NOT NULL DEFAULT 'immediate',
  
  -- 通知対象イベント（オン/オフ）
  notify_new_verification BOOLEAN NOT NULL DEFAULT true,
  notify_new_report BOOLEAN NOT NULL DEFAULT true,
  notify_new_user BOOLEAN NOT NULL DEFAULT true,
  notify_email_failure BOOLEAN NOT NULL DEFAULT true,
  
  -- メール通知のオン/オフ
  email_notification_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- 最後のサマリー送信日時
  last_summary_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(admin_id)
);

-- RLS有効化
ALTER TABLE sasaeai_admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- 管理者のみ自分の設定を読み書き可能
CREATE POLICY "admin_own_settings_select" ON sasaeai_admin_notification_settings
  FOR SELECT USING (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "admin_own_settings_insert" ON sasaeai_admin_notification_settings
  FOR INSERT WITH CHECK (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "admin_own_settings_update" ON sasaeai_admin_notification_settings
  FOR UPDATE USING (
    admin_id = auth.uid() AND
    EXISTS (SELECT 1 FROM sasaeai_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 管理者通知キューテーブル（サマリー用にイベントを蓄積）
CREATE TABLE IF NOT EXISTS sasaeai_admin_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'new_verification', 'new_report', 'new_user', 'email_failure'
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT false
);

-- RLS有効化
ALTER TABLE sasaeai_admin_notification_queue ENABLE ROW LEVEL SECURITY;

-- Cronジョブからアクセスするため、サービスロールのみ許可
CREATE POLICY "service_role_only" ON sasaeai_admin_notification_queue
  FOR ALL USING (auth.role() = 'service_role');

-- インデックス
CREATE INDEX IF NOT EXISTS idx_admin_notification_queue_admin ON sasaeai_admin_notification_queue(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notification_queue_processed ON sasaeai_admin_notification_queue(processed);
CREATE INDEX IF NOT EXISTS idx_admin_notification_queue_created ON sasaeai_admin_notification_queue(created_at);

-- 確認
SELECT 'テーブル作成完了' as result;
