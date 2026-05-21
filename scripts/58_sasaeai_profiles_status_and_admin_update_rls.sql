-- sasaeai_profiles: アカウント status（active / blocked）と、管理者による他ユーザー行の更新を許可する RLS
-- アプリ側は status = 'blocked' でログイン後アクセスを拒否する想定

ALTER TABLE public.sasaeai_profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

COMMENT ON COLUMN public.sasaeai_profiles.status IS 'active = 通常利用, blocked = 管理ブロック（アプリ制限）';

ALTER TABLE public.sasaeai_profiles DROP CONSTRAINT IF EXISTS sasaeai_profiles_status_check;
ALTER TABLE public.sasaeai_profiles
  ADD CONSTRAINT sasaeai_profiles_status_check CHECK (status IN ('active', 'blocked'));

-- 管理者が任意ユーザーのプロフィールを更新できるようにする（既存の「自分のみ更新」と併存・OR 合成）
DROP POLICY IF EXISTS "Admins can update any profile for moderation" ON public.sasaeai_profiles;
CREATE POLICY "Admins can update any profile for moderation"
  ON public.sasaeai_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sasaeai_profiles p
      WHERE p.id = auth.uid() AND p.is_admin IS TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sasaeai_profiles p2
      WHERE p2.id = auth.uid() AND p2.is_admin IS TRUE
    )
  );
