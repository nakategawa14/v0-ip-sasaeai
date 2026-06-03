import { Stack } from "expo-router"

import { StackBackButton } from "@/components/navigation/StackBackButton"

/**
 * プロフィールタブ内のスタック。編集画面もここに含め、下部タブバーを常に表示する。
 */
export default function ProfileTabStackLayout() {
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
    >
      <Stack.Screen name="index" options={{ title: "プロフィール" }} />
      <Stack.Screen
        name="edit"
        options={{
          title: "プロフィール編集",
          headerLeft: () => <StackBackButton label="キャンセル" />,
        }}
      />
    </Stack>
  )
}
