-- 報告テーブルの作成
CREATE TABLE IF NOT EXISTS sasaeai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('inappropriate_profile', 'harassment', 'scam', 'fake_profile', 'spam', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON sasaeai_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON sasaeai_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON sasaeai_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON sasaeai_reports(created_at DESC);

-- RLS有効化
ALTER TABLE sasaeai_reports ENABLE ROW LEVEL SECURITY;

-- RLSポリシー：ユーザーは自分が報告したもののみ閲覧可能
CREATE POLICY "Users can view their own reports"
  ON sasaeai_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- RLSポリシー：ユーザーは報告を作成可能
CREATE POLICY "Users can create reports"
  ON sasaeai_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON sasaeai_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();
