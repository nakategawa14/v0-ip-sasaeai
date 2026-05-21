import { Redirect } from "expo-router"

import { useAuth } from "@/contexts/AuthContext"

/** 起動時: SecureStore から復元したセッションに応じてタブ or ログインへ */
export default function Index() {
  const { session, initialized, accessGateResolved } = useAuth()

  if (!initialized || (session && !accessGateResolved)) {
    return null
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return <Redirect href="/(tabs)" />
}
