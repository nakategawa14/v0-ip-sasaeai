import { Stack } from "expo-router"

import { StackBackButton } from "@/components/navigation/StackBackButton"

export default function ProfileAuxStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        gestureEnabled: true,
        headerTintColor: "#db2777",
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "800", color: "#111827" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#fdf2f8" },
      }}
    >
      <Stack.Screen
        name="blocks"
        options={{
          title: "ブロックしたユーザー",
          headerLeft: () => <StackBackButton />,
        }}
      />
    </Stack>
  )
}
