-- =============================================================================
-- いいね儀式 + マッチ status（matched）とチャット解禁の連携
-- 実行後: アプリから sasaeai_send_like(p_peer_id) を呼び出してください。
-- =============================================================================

-- 1) マッチに status 列（既存行は matched とみなす）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sasaeai_matches' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.sasaeai_matches ADD COLUMN status text;
  END IF;
END $$;

UPDATE public.sasaeai_matches
SET status = 'matched'
WHERE status IS NULL;

ALTER TABLE public.sasaeai_matches
  ALTER COLUMN status SET DEFAULT 'matched';

DO $$
BEGIN
  ALTER TABLE public.sasaeai_matches
    ADD CONSTRAINT sasaeai_matches_status_check CHECK (status IN ('pending', 'matched'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.sasaeai_matches
  ALTER COLUMN status SET NOT NULL;

-- 2) チャットルーム取得 RPC: status = matched のマッチのみ（NULL はレガシー許容）
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
    AND (m.status = 'matched' OR m.status IS NULL)
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

-- 3) いいね送信 + 相互いいねでマッチ成立（status = matched）
CREATE OR REPLACE FUNCTION public.sasaeai_send_like(p_peer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  u1 uuid;
  u2 uuid;
  already_liked boolean;
  reciprocal boolean;
  had_match boolean;
  celebrate boolean := false;
BEGIN
  IF me IS NULL OR p_peer_id IS NULL OR p_peer_id = me THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.sasaeai_likes l
    WHERE l.from_user_id = me AND l.to_user_id = p_peer_id
  ) INTO already_liked;

  IF NOT already_liked THEN
    INSERT INTO public.sasaeai_likes (from_user_id, to_user_id)
    VALUES (me, p_peer_id);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.sasaeai_likes l
    WHERE l.from_user_id = p_peer_id AND l.to_user_id = me
  ) INTO reciprocal;

  IF NOT reciprocal THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already_liked', already_liked,
      'reciprocal', false,
      'celebrate', false
    );
  END IF;

  IF me < p_peer_id THEN
    u1 := me;
    u2 := p_peer_id;
  ELSE
    u1 := p_peer_id;
    u2 := me;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.sasaeai_matches m
    WHERE m.user1_id = u1 AND m.user2_id = u2
  ) INTO had_match;

  INSERT INTO public.sasaeai_matches (user1_id, user2_id, status, is_active, matched_at)
  VALUES (u1, u2, 'matched', true, now())
  ON CONFLICT (user1_id, user2_id) DO UPDATE
    SET status = 'matched',
        is_active = true,
        matched_at = COALESCE(public.sasaeai_matches.matched_at, EXCLUDED.matched_at);

  celebrate := NOT had_match;

  RETURN jsonb_build_object(
    'ok', true,
    'already_liked', already_liked,
    'reciprocal', true,
    'celebrate', celebrate
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sasaeai_send_like(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sasaeai_send_like(uuid) TO authenticated;

COMMENT ON FUNCTION public.sasaeai_send_like(uuid) IS 'いいねを記録し、相互いいねなら sasaeai_matches を matched にする';
