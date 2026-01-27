-- モデレーション機能：ステップ3 - 関数作成

-- BANチェック関数
CREATE OR REPLACE FUNCTION check_user_banned(
  p_user_id UUID,
  p_ban_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM sasaeai_bans
    WHERE user_id = p_user_id
    AND ban_type IN (p_ban_type, 'platform')
    AND (banned_until IS NULL OR banned_until > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成
DROP TRIGGER IF EXISTS update_reports_updated_at ON sasaeai_reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON sasaeai_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bans_updated_at ON sasaeai_bans;
CREATE TRIGGER update_bans_updated_at
  BEFORE UPDATE ON sasaeai_bans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
