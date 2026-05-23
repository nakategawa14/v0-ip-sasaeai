import { Redirect, Stack } from "expo-router"

import { useAuth } from "@/contexts/AuthContext"

/** 他ユーザーの公開プロフィール（タブ外のルートスタック） */
export default function UserProfileLayout() {
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
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerTintColor: "#db2777",
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "800", color: "#111827" },
        headerBackTitle: "戻る",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#fdf2f8" },
      }}
    />
  )
}
