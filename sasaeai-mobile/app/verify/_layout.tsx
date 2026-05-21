import { Redirect, Stack } from "expo-router"

import { useAuth } from "@/contexts/AuthContext"

export default function VerifyLayout() {
  const { session, initialized, accessGateResolved } = useAuth()

  if (!initialized || (session && !accessGateResolved)) {
    return null
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "戻る",
        headerTintColor: "#db2777",
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "700", color: "#111827" },
      }}
    />
  )
}
