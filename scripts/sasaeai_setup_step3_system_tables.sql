-- ささえ愛: システムテーブル作成（ステップ3）
-- ステップ2が成功した後に実行してください

-- 1. サブスクリプションテーブル
CREATE TABLE IF NOT EXISTS public.sasaeai_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('standard', 'coupon')),
  amount INTEGER NOT NULL,
  payment_provider TEXT,
  external_subscription_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. クーポンコードテーブル
CREATE TABLE IF NOT EXISTS public.sasaeai_coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. クーポン使用履歴テーブル
CREATE TABLE IF NOT EXISTS public.sasaeai_coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.sasaeai_coupon_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

-- 4. 通報テーブル
CREATE TABLE IF NOT EXISTS public.sasaeai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_sasaeai_subscriptions_user ON public.sasaeai_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sasaeai_subscriptions_status ON public.sasaeai_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sasaeai_coupon_codes_code ON public.sasaeai_coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_sasaeai_reports_status ON public.sasaeai_reports(status);

-- 完了メッセージ
SELECT 'ささえ愛: システムテーブル作成完了' AS status;
