/**
 * ルートレイアウト: フォント・認証初期化・通知起動の副作用を制御する。
 * - `expo-notifications` のフックは Web では利用不可のため、`Platform.OS !== "web"` のときだけ
 *   `LastNotificationResponseHandler` をマウントして呼ぶ（Rules of Hooks 遵守）。
 */
import FontAwesome from "@expo/vector-icons/FontAwesome"
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { useFonts } from "expo-font"
import * as Notifications from "expo-notifications"
import { Stack, useRouter } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect, useRef } from "react"
import { Platform } from "react-native"
import "react-native-reanimated"
import "react-native-url-polyfill/auto"

import { useColorScheme } from "@/components/useColorScheme"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"

export { ErrorBoundary } from "expo-router"

SplashScreen.preventAutoHideAsync()

// Webでない場合のみ通知ハンドラーを設定
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
}

/** Web では `useLastNotificationResponse` が利用不可のため、このコンポーネントはネイティブでのみマウントする。 */
function LastNotificationResponseHandler() {
  const router = useRouter()
  const lastNotificationResponse = Notifications.useLastNotificationResponse()
  const handledNotificationIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!lastNotificationResponse) return

    const response = lastNotificationResponse
    const responseId = response.notification.request.identifier
    if (handledNotificationIdRef.current === responseId) return
    handledNotificationIdRef.current = responseId

    const data = response.notification.request.content.data as Record<string, unknown>
    const chatRoomId = typeof data?.chat_room_id === "string" ? data.chat_room_id : null
    if (!chatRoomId) return

    router.push({ pathname: "/chat/[id]", params: { id: chatRoomId } })
  }, [lastNotificationResponse, router])

  return null
}

function RootLayoutContent() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  })
  const { initialized } = useAuth()

  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded && initialized) {
      SplashScreen.hideAsync()
    }
  }, [loaded, initialized])

  return (
    <>
      {Platform.OS !== "web" ? <LastNotificationResponseHandler /> : null}
      {!loaded || !initialized ? null : <RootLayoutNav />}
    </>
  )
}

function RootLayoutNav() {
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="verify" options={{ headerShown: false }} />
        <Stack.Screen name="user" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen name="support" />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  )
}