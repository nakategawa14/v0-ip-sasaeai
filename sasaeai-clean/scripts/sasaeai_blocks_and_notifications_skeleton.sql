-- モバイルのブロック機能用スケルトン（RLS・ポリシーは環境に合わせて追加してください）
-- 実テーブル名は TABLES.BLOCKS = sasaeai_blocks（指示の user_blocks と同一用途）

CREATE TABLE IF NOT EXISTS public.sasaeai_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sasaeai_blocks_pkey PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT sasaeai_blocks_no_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS sasaeai_blocks_blocked_id_created_at_idx
  ON public.sasaeai_blocks (blocked_id, created_at DESC);

-- 運営が「誰が誰をブロックしたか」を追うための監査ログ（アプリから insert、またはトリガーで複製してもよい）
CREATE TABLE IF NOT EXISTS public.sasaeai_system_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sasaeai_system_notifications_event_created_idx
  ON public.sasaeai_system_notifications (event_type, created_at DESC);

-- 短期間に複数人からブロックされたユーザーを目立たせる（アプリ側でも同条件で更新）
ALTER TABLE public.sasaeai_profiles
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false;
