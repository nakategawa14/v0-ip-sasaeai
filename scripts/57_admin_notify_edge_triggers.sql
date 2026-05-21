-- =============================================================================
-- 管理人向けメール通知: DB トリガー → pg_net → Edge Function `admin-notify` → Resend
--
-- 前提:
-- 1) Edge Function `admin-notify` をデプロイし、Secrets に以下を設定:
--    RESEND_API_KEY, ADMIN_EMAIL, ADMIN_NOTIFY_WEBHOOK_SECRET,
--    （任意）RESEND_FROM_EMAIL
-- 2) Supabase SQL で Vault に次の 2 つを登録（値はプロジェクトに合わせて置換）:
--    select vault.create_secret('https://<PROJECT_REF>.supabase.co/functions/v1/admin-notify', 'admin_notify_url');
--    select vault.create_secret('<ADMIN_NOTIFY_WEBHOOK_SECRET と同一のランダム文字列>', 'admin_notify_secret');
-- 3) Dashboard → Database → Extensions で pg_net を有効化（未の場合）
--
-- シークレット未設定時は通知をスキップし、INSERT/UPDATE は失敗しません（ログのみ）。
-- =============================================================================

-- 本人確認ステータス（モバイル eKYC 等で使用）
ALTER TABLE public.sasaeai_profiles
  ADD COLUMN IF NOT EXISTS verification_status text;

COMMENT ON COLUMN public.sasaeai_profiles.verification_status IS '本人確認: pending | approved | rejected など';

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Vault は Supabase 管理プロジェクトで通常利用可能（未利用の場合はスキップされログに残る）
CREATE OR REPLACE FUNCTION public.sasaeai_admin_notify_request(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net
AS $$
DECLARE
  fn_url text;
  wh_secret text;
BEGIN
  BEGIN
    SELECT ds.decrypted_secret INTO fn_url
    FROM vault.decrypted_secrets ds
    WHERE ds.name = 'admin_notify_url'
    LIMIT 1;

    SELECT ds.decrypted_secret INTO wh_secret
    FROM vault.decrypted_secrets ds
    WHERE ds.name = 'admin_notify_secret'
    LIMIT 1;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE LOG 'sasaeai_admin_notify_request: vault.decrypted_secrets not available; skip';
      RETURN;
  END;

  IF fn_url IS NULL OR btrim(fn_url) = '' OR wh_secret IS NULL OR btrim(wh_secret) = '' THEN
    RAISE LOG 'sasaeai_admin_notify_request: vault secrets admin_notify_url / admin_notify_secret missing; skip';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-admin-notify-secret', wh_secret
    ),
    body := payload
  );
EXCEPTION
  WHEN undefined_function THEN
    RAISE WARNING 'sasaeai_admin_notify_request: net.http_post unavailable (enable pg_net): %', SQLERRM;
  WHEN OTHERS THEN
    RAISE WARNING 'sasaeai_admin_notify_request failed: %', SQLERRM;
END;
$$;

-- 違反通報: 新規行
CREATE OR REPLACE FUNCTION public.sasaeai_trg_notify_admin_on_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sasaeai_admin_notify_request(jsonb_build_object('event', 'report', 'id', NEW.id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sasaeai_reports_admin_notify ON public.sasaeai_reports;

CREATE TRIGGER trg_sasaeai_reports_admin_notify
  AFTER INSERT ON public.sasaeai_reports
  FOR EACH ROW
  EXECUTE PROCEDURE public.sasaeai_trg_notify_admin_on_report();

-- eKYC: verification_status が pending へ遷移したとき
CREATE OR REPLACE FUNCTION public.sasaeai_trg_notify_admin_on_ekyc_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.verification_status IS NOT DISTINCT FROM 'pending'
     AND OLD.verification_status IS DISTINCT FROM 'pending' THEN
    PERFORM public.sasaeai_admin_notify_request(jsonb_build_object('event', 'ekyc', 'user_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sasaeai_profiles_ekyc_admin_notify_update ON public.sasaeai_profiles;

CREATE TRIGGER trg_sasaeai_profiles_ekyc_admin_notify_update
  AFTER UPDATE OF verification_status ON public.sasaeai_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.sasaeai_trg_notify_admin_on_ekyc_update();

-- 新規プロフィール行で最初から pending の場合
CREATE OR REPLACE FUNCTION public.sasaeai_trg_notify_admin_on_ekyc_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.verification_status IS NOT DISTINCT FROM 'pending' THEN
    PERFORM public.sasaeai_admin_notify_request(jsonb_build_object('event', 'ekyc', 'user_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sasaeai_profiles_ekyc_admin_notify_insert ON public.sasaeai_profiles;

CREATE TRIGGER trg_sasaeai_profiles_ekyc_admin_notify_insert
  AFTER INSERT ON public.sasaeai_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.sasaeai_trg_notify_admin_on_ekyc_insert();
