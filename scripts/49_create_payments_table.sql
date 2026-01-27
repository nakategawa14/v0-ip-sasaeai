-- sasaeai_paymentsテーブルを作成

-- 既存のテーブルがあれば削除
DROP TABLE IF EXISTS sasaeai_payments CASCADE;

-- 決済履歴テーブル
CREATE TABLE sasaeai_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'payjp',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payjp_charge_id TEXT,
  payjp_customer_id TEXT,
  payjp_subscription_id TEXT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  next_billing_date TIMESTAMPTZ,
  coupon_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_payments_user_id ON sasaeai_payments(user_id);
CREATE INDEX idx_payments_payment_date ON sasaeai_payments(payment_date DESC);
CREATE INDEX idx_payments_status ON sasaeai_payments(payment_status);
CREATE INDEX idx_payments_payjp_subscription ON sasaeai_payments(payjp_subscription_id);

-- RLSを有効化
ALTER TABLE sasaeai_payments ENABLE ROW LEVEL SECURITY;

-- ポリシー：自分の決済履歴のみ閲覧可能
CREATE POLICY "Users can view own payments"
  ON sasaeai_payments FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー：管理者は全ての決済履歴を閲覧可能
CREATE POLICY "Admins can view all payments"
  ON sasaeai_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sasaeai_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ポリシー：サービスロールは全ての操作可能（Webhook用）
CREATE POLICY "Service role can manage payments"
  ON sasaeai_payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- sasaeai_profilesにPAY.JP関連カラムを追加
ALTER TABLE sasaeai_profiles 
  ADD COLUMN IF NOT EXISTS payjp_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS payjp_subscription_id TEXT;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_profiles_payjp_customer ON sasaeai_profiles(payjp_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_payjp_subscription ON sasaeai_profiles(payjp_subscription_id);

-- 確認
SELECT 
  'sasaeai_payments' as table_name,
  COUNT(*) as row_count
FROM sasaeai_payments;
