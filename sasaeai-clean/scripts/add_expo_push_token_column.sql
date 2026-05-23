ALTER TABLE public.sasaeai_profiles
  ADD COLUMN IF NOT EXISTS expo_push_token text;

COMMENT ON COLUMN public.sasaeai_profiles.expo_push_token IS
  'Expo Push Notifications token (ExponentPushToken[...])';
