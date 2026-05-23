import { TABLES } from "@/lib/constants/tables"
import { supabase } from "@/lib/supabase"

export async function clearExpoPushTokenForUser(userId: string): Promise<void> {
  const { error } = await supabase.from(TABLES.PROFILES).update({ expo_push_token: null }).eq("id", userId)
  if (error && __DEV__) {
    console.warn("[push] expo_push_token clear failed:", error.message)
  }
}
