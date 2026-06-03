-- 新着メッセージ INSERT 時に Edge Function send-chat-notification を呼ぶ雛形
-- 前提:
-- 1) Supabase Edge Function "send-chat-notification" を deploy 済み
-- 2) Database で pg_net / pgcrypto / vault を利用可能

create extension if not exists pg_net;
create extension if not exists pgcrypto;

-- Function 呼び出し用の Service Role Key（project settings の service_role）
do $$
begin
  perform vault.create_secret(
    'REPLACE_WITH_SUPABASE_SERVICE_ROLE_KEY',
    'service_role_key',
    'Service role key for db webhook -> edge function'
  );
exception
  when unique_violation then
    null;
end
$$;

-- 任意: Webhook 用シークレット（Function 側 CHAT_WEBHOOK_SECRET と一致させる）
do $$
begin
  perform vault.create_secret(
    'REPLACE_WITH_LONG_RANDOM_SECRET',
    'chat_webhook_secret',
    'Secret for chat message webhook'
  );
exception
  when unique_violation then
    null;
end
$$;

create or replace function public.sasaeai_notify_chat_message_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  function_url text := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-chat-notification';
  service_role_key text;
  webhook_secret text;
begin
  service_role_key := (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1);
  webhook_secret := (select decrypted_secret from vault.decrypted_secrets where name = 'chat_webhook_secret' limit 1);
  if service_role_key is null then
    raise exception 'vault secret "service_role_key" is required';
  end if;

  perform net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key,
      'x-webhook-secret', coalesce(webhook_secret, '')
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trg_sasaeai_chat_message_insert_notify on public.sasaeai_chat_messages;
create trigger trg_sasaeai_chat_message_insert_notify
after insert on public.sasaeai_chat_messages
for each row execute function public.sasaeai_notify_chat_message_insert();
