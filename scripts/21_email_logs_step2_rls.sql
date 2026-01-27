-- メール送信ログテーブル作成 - ステップ2: RLS有効化とポリシー

-- RLSを有効化
ALTER TABLE sasaeai_email_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能
CREATE POLICY "管理者はメールログを閲覧可能" ON sasaeai_email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles 
      WHERE sasaeai_profiles.id = auth.uid() 
      AND sasaeai_profiles.role = 'admin'
    )
  );

-- サービスロールは全操作可能（API経由）
CREATE POLICY "サービスロールは全操作可能" ON sasaeai_email_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 確認
SELECT 'RLSポリシー作成完了' as result;
