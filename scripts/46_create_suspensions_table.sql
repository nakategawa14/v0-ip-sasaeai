-- ユーザー停止・BAN履歴テーブルを作成
-- 既存のsasaeai_bansテーブルを拡張

-- 停止履歴テーブル
CREATE TABLE IF NOT EXISTS sasaeai_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suspended_by UUID NOT NULL REFERENCES auth.users(id),
  suspension_type TEXT NOT NULL CHECK (suspension_type IN ('temporary', 'permanent')),
  suspension_reason TEXT NOT NULL,
  warning_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ, -- NULLの場合は永久BAN
  is_active BOOLEAN DEFAULT true,
  lifted_at TIMESTAMPTZ,
  lifted_by UUID REFERENCES auth.users(id),
  lift_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_suspensions_user_id ON sasaeai_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_suspensions_is_active ON sasaeai_suspensions(is_active);
CREATE INDEX IF NOT EXISTS idx_suspensions_ends_at ON sasaeai_suspensions(ends_at);

-- RLS有効化
ALTER TABLE sasaeai_suspensions ENABLE ROW LEVEL SECURITY;

-- RLSポリシー：管理者のみ閲覧・操作可能
CREATE POLICY "Admins can view all suspensions"
  ON sasaeai_suspensions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert suspensions"
  ON sasaeai_suspensions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update suspensions"
  ON sasaeai_suspensions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ユーザーは自分の停止状態を確認可能
CREATE POLICY "Users can view own suspension"
  ON sasaeai_suspensions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- sasaeai_profilesにis_suspendedカラムを追加
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE sasaeai_profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- 確認
SELECT 
  'sasaeai_suspensions' as table_name,
  COUNT(*) as row_count
FROM sasaeai_suspensions;
