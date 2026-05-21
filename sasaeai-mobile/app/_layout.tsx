import "react-native-url-polyfill/auto"

import FontAwesome from "@expo/vector-icons/FontAwesome"
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"
import "react-native-reanimated"

import { useColorScheme } from "@/components/useColorScheme"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"

export { ErrorBoundary } from "expo-router"

SplashScreen.preventAutoHideAsync()

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

  if (!loaded || !initialized) {
    return null
  }

  return <RootLayoutNav />
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
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        <Stack.Screen name="support" />
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
