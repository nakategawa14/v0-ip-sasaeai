-- ささえ愛専用テーブル（既存のぽちゃマッチと共存）
-- テーブル名に sasaeai_ 接頭辞を使用

-- ユーザープロフィールテーブル
CREATE TABLE sasaeai_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('男性', '女性', 'その他', '回答しない')),
  prefecture TEXT,
  self_introduction TEXT,
  profile_image_url TEXT,
  
  -- 詳細プロフィール項目
  height INTEGER,
  body_type TEXT,
  occupation TEXT,
  annual_income TEXT,
  education TEXT,
  living_situation TEXT,
  hometown TEXT,
  drinking TEXT,
  smoking TEXT,
  
  -- 障がい・難病関連
  has_disability BOOLEAN DEFAULT false,
  disability_type TEXT,
  disability_details TEXT,
  support_needs TEXT,
  
  -- 健常者の場合
  is_supporter BOOLEAN DEFAULT false,
  supporter_message TEXT,
  
  -- 会員ステータス
  membership_status TEXT DEFAULT 'free' CHECK (membership_status IN ('free', 'premium')),
  membership_started_at TIMESTAMPTZ,
  membership_expires_at TIMESTAMPTZ,
  coupon_code TEXT,
  discounted_price INTEGER,
  
  -- その他
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  suspended_until TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- プロフィールタグテーブル
CREATE TABLE sasaeai_profile_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  tag_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- プロフィール写真テーブル
CREATE TABLE sasaeai_profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- いいね機能
CREATE TABLE sasaeai_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- マッチング
CREATE TABLE sasaeai_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user1_id, user2_id)
);

-- メッセージテーブル
CREATE TABLE sasaeai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES sasaeai_matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 決済履歴テーブル
CREATE TABLE sasaeai_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),
  subscription_id TEXT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  next_billing_date TIMESTAMPTZ,
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ブロック機能
CREATE TABLE sasaeai_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- 通報機能
CREATE TABLE sasaeai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- クーポンコードテーブル
CREATE TABLE sasaeai_coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- モデレーションログテーブル
CREATE TABLE sasaeai_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  admin_id UUID,
  action TEXT NOT NULL,
  reason TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザー停止履歴テーブル
CREATE TABLE sasaeai_suspension_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sasaeai_profiles(id) ON DELETE CASCADE,
  admin_id UUID,
  reason TEXT NOT NULL,
  suspended_at TIMESTAMPTZ DEFAULT NOW(),
  suspended_until TIMESTAMPTZ,
  is_permanent BOOLEAN DEFAULT false,
  reactivated_at TIMESTAMPTZ,
  reactivation_reason TEXT
);

-- インデックス作成
CREATE INDEX idx_sasaeai_profiles_membership ON sasaeai_profiles(membership_status);
CREATE INDEX idx_sasaeai_profiles_gender ON sasaeai_profiles(gender);
CREATE INDEX idx_sasaeai_profiles_prefecture ON sasaeai_profiles(prefecture);
CREATE INDEX idx_sasaeai_profiles_active ON sasaeai_profiles(is_active, is_suspended);
CREATE INDEX idx_sasaeai_tags_user ON sasaeai_profile_tags(user_id);
CREATE INDEX idx_sasaeai_tags_category ON sasaeai_profile_tags(category);
CREATE INDEX idx_sasaeai_likes_from_user ON sasaeai_likes(from_user_id);
CREATE INDEX idx_sasaeai_likes_to_user ON sasaeai_likes(to_user_id);
CREATE INDEX idx_sasaeai_matches_users ON sasaeai_matches(user1_id, user2_id);
CREATE INDEX idx_sasaeai_messages_match ON sasaeai_messages(match_id);
CREATE INDEX idx_sasaeai_messages_sender ON sasaeai_messages(sender_id);
CREATE INDEX idx_sasaeai_messages_receiver ON sasaeai_messages(receiver_id);
CREATE INDEX idx_sasaeai_payments_user ON sasaeai_payments(user_id);
CREATE INDEX idx_sasaeai_reports_status ON sasaeai_reports(status);
