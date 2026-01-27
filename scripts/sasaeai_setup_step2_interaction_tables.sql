-- ささえ愛: インタラクションテーブル作成（ステップ2）
-- ステップ1が成功した後に実行してください

-- 1. いいねテーブル
CREATE TABLE IF NOT EXISTS public.sasaeai_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- 2. マッチテーブル
CREATE TABLE IF NOT EXISTS public.sasaeai_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user1_id, user2_id)
);

-- 3. メッセージテーブル
CREATE TABLE IF NOT EXISTS public.sasaeai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.sasaeai_matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ブロックテーブル
CREATE TABLE IF NOT EXISTS public.sasaeai_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.sasaeai_profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_sasaeai_likes_from_user ON public.sasaeai_likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_sasaeai_likes_to_user ON public.sasaeai_likes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_sasaeai_matches_user1 ON public.sasaeai_matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_sasaeai_matches_user2 ON public.sasaeai_matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_sasaeai_messages_match ON public.sasaeai_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_sasaeai_messages_sender ON public.sasaeai_messages(sender_id);

-- 完了メッセージ
SELECT 'ささえ愛: インタラクションテーブル作成完了' AS status;
