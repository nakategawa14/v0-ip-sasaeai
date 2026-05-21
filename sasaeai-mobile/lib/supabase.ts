import "react-native-url-polyfill/auto"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import * as SecureStore from "expo-secure-store"

/**
 * Web 版（親の lib/supabase/client.ts）と同じ Project URL / anon key。
 * Web は Cookie（@supabase/ssr）、モバイルは expo-secure-store にセッションを保存し、
 * persistSession + このストレージでアプリ終了後もログイン状態を復元する。
 *
 * .env: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
 * （Web の NEXT_PUBLIC_* と同じ値でよい）
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL または EXPO_PUBLIC_SUPABASE_ANON_KEY が未設定です。sasaeai-mobile/.env を確認してください。",
  )
}

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

// Web の createBrowserClient は auth オプションをほぼデフォルトのまま。
// モバイルはストレージと detectSessionInUrl のみ差し替え（flowType は未指定＝Web に近い挙動）。
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

/** Web 版の createClient() と同様、常に同一インスタンスを返す */
export function createClient() {
  return supabase
}
