-- モバイル「シークレットモード」用。Supabase SQL エディタで 1 回実行してください。
alter table public.sasaeai_profiles
  add column if not exists is_secret_mode boolean not null default false;

comment on column public.sasaeai_profiles.is_secret_mode is
  'ON の場合、当該ユーザーは「自分がいいねした相手」にのみプロフィールを一覧・詳細で公開する';
