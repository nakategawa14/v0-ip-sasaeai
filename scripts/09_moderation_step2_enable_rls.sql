-- モデレーション機能：ステップ2 - RLS有効化とポリシー作成

-- RLS有効化
ALTER TABLE sasaeai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sasaeai_bans ENABLE ROW LEVEL SECURITY;

-- 通報テーブルのポリシー
CREATE POLICY "Users can create reports"
  ON sasaeai_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON sasaeai_reports FOR SELECT
  USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

CREATE POLICY "Admins can view all reports"
  ON sasaeai_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update reports"
  ON sasaeai_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ブロックテーブルのポリシー
CREATE POLICY "Users can create blocks"
  ON sasaeai_blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view their own blocks"
  ON sasaeai_blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON sasaeai_blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- BANテーブルのポリシー
CREATE POLICY "Users can view their own bans"
  ON sasaeai_bans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage bans"
  ON sasaeai_bans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );
