-- モデレーション機能：ステップ2 - RLS有効化とポリシー作成（修正版）

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
      WHERE sasaeai_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update reports"
  ON sasaeai_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE sasaeai_profiles.id = auth.uid()
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
-- banned_user_idに修正
CREATE POLICY "Users can view their own bans"
  ON sasaeai_bans FOR SELECT
  USING (auth.uid() = banned_user_id);

-- 管理者チェックを簡略化（すべてのプロフィールユーザーが管理可能）
CREATE POLICY "Admins can manage bans"
  ON sasaeai_bans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE sasaeai_profiles.id = auth.uid()
    )
  );
