-- =============================================================================
-- マッチング成立後の 1対1 DM（chat_room_id ベース）+ Supabase Realtime 用
-- 既存の sasaeai_messages（match_id 直結）とは別テーブルで共存させます。
-- =============================================================================

-- 1) チャットルーム（1 マッチにつき最大 1 ルーム）
CREATE TABLE IF NOT EXISTS public.sasaeai_chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.sasaeai_matches (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sasaeai_chat_rooms_match_unique UNIQUE (match_id)
);

CREATE INDEX IF NOT EXISTS idx_sasaeai_chat_rooms_match_id ON public.sasaeai_chat_rooms (match_id);

-- 2) メッセージ（要件どおり）
CREATE TABLE IF NOT EXISTS public.sasaeai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id uuid NOT NULL REFERENCES public.sasaeai_chat_rooms (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false,
  CONSTRAINT sasaeai_chat_messages_content_nonempty CHECK (char_length(trim(content)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_sasaeai_chat_messages_room_created
  ON public.sasaeai_chat_messages (chat_room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sasaeai_chat_messages_sender
  ON public.sasaeai_chat_messages (sender_id);

-- 3) マッチの last_message_at を更新
CREATE OR REPLACE FUNCTION public.sasaeai_touch_match_last_message_from_chat()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.sasaeai_matches m
  SET last_message_at = NEW.created_at
  FROM public.sasaeai_chat_rooms cr
  WHERE cr.id = NEW.chat_room_id
    AND m.id = cr.match_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sasaeai_chat_messages_touch_match ON public.sasaeai_chat_messages;
CREATE TRIGGER sasaeai_chat_messages_touch_match
  AFTER INSERT ON public.sasaeai_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.sasaeai_touch_match_last_message_from_chat();

-- 4) RLS
ALTER TABLE public.sasaeai_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sasaeai_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_rooms_select_members" ON public.sasaeai_chat_rooms;
CREATE POLICY "chat_rooms_select_members"
  ON public.sasaeai_chat_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sasaeai_matches m
      WHERE m.id = match_id
        AND m.is_active IS NOT FALSE
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "chat_rooms_insert_members" ON public.sasaeai_chat_rooms;
CREATE POLICY "chat_rooms_insert_members"
  ON public.sasaeai_chat_rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sasaeai_matches m
      WHERE m.id = match_id
        AND m.is_active IS NOT FALSE
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "chat_messages_select_members" ON public.sasaeai_chat_messages;
CREATE POLICY "chat_messages_select_members"
  ON public.sasaeai_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sasaeai_chat_rooms cr
      JOIN public.sasaeai_matches m ON m.id = cr.match_id
      WHERE cr.id = chat_room_id
        AND m.is_active IS NOT FALSE
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "chat_messages_insert_self" ON public.sasaeai_chat_messages;
CREATE POLICY "chat_messages_insert_self"
  ON public.sasaeai_chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.sasaeai_chat_rooms cr
      JOIN public.sasaeai_matches m ON m.id = cr.match_id
      WHERE cr.id = chat_room_id
        AND m.is_active IS NOT FALSE
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "chat_messages_update_read_recipient" ON public.sasaeai_chat_messages;
CREATE POLICY "chat_messages_update_read_recipient"
  ON public.sasaeai_chat_messages FOR UPDATE
  USING (
    sender_id IS DISTINCT FROM auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.sasaeai_chat_rooms cr
      JOIN public.sasaeai_matches m ON m.id = cr.match_id
      WHERE cr.id = chat_room_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    sender_id IS DISTINCT FROM auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.sasaeai_chat_rooms cr
      JOIN public.sasaeai_matches m ON m.id = cr.match_id
      WHERE cr.id = chat_room_id
        AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- 5) お相手 user id からマッチを解決し、ルームを返す（無ければ作成）
CREATE OR REPLACE FUNCTION public.sasaeai_ensure_chat_room_for_peer(p_peer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  v_match_id uuid;
  v_room_id uuid;
BEGIN
  IF me IS NULL OR p_peer_id IS NULL OR p_peer_id = me THEN
    RETURN NULL;
  END IF;

  SELECT m.id INTO v_match_id
  FROM public.sasaeai_matches m
  WHERE m.is_active IS NOT FALSE
    AND (
      (m.user1_id = me AND m.user2_id = p_peer_id)
      OR (m.user1_id = p_peer_id AND m.user2_id = me)
    )
  LIMIT 1;

  IF v_match_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT cr.id INTO v_room_id
  FROM public.sasaeai_chat_rooms cr
  WHERE cr.match_id = v_match_id
  LIMIT 1;

  IF v_room_id IS NULL THEN
    INSERT INTO public.sasaeai_chat_rooms (match_id)
    VALUES (v_match_id)
    RETURNING id INTO v_room_id;
  END IF;

  RETURN v_room_id;
END;
$$;

REVOKE ALL ON FUNCTION public.sasaeai_ensure_chat_room_for_peer(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sasaeai_ensure_chat_room_for_peer(uuid) TO authenticated;

-- 6) Realtime（publication にテーブルを追加）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sasaeai_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sasaeai_chat_messages;
  END IF;
END $$;

-- UPDATE（既読）もクライアントで反映したい場合は同様に追加可能:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.sasaeai_chat_messages; 上で済み

COMMENT ON TABLE public.sasaeai_chat_rooms IS 'マッチ単位の 1対1 チャットルーム';
COMMENT ON TABLE public.sasaeai_chat_messages IS 'DM メッセージ（Realtime 対象）';
