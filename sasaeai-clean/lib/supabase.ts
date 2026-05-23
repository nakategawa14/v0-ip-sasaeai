import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"; // ← これを追加しました
import "react-native-url-polyfill/auto"

/**
 * Web 版と共通の Project URL / anon key。
 * Web は localStorage、モバイルは expo-secure-store を使用します。
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL または EXPO_PUBLIC_SUPABASE_ANON_KEY が未設定です。",
  )
}

// Webビルド時と実機実行時でストレージを使い分けるアダプター
const customStorageAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorageAdapter, // ← 作成したアダプターに差し替え
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export function createClient() {
  return supabase
}