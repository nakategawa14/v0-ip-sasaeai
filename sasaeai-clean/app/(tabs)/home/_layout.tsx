import { Stack } from "expo-router"

export default function HomeTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="admin/[...path]" options={{ title: "管理画面" }} />
    </Stack>
  )
}
