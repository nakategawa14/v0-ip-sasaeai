import { BrandLogo } from "@/components/brand/BrandLogo"
import { Redirect, router } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAuth } from "@/contexts/AuthContext"

/** 起動時: 未ログインはランディング、ログイン済みはタブへ */
export default function Index() {
  const { session, initialized, accessGateResolved } = useAuth()

  if (!initialized || (session && !accessGateResolved)) {
    return null
  }

  if (session) {
    return <Redirect href="/(tabs)" />
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gradientBg} pointerEvents="none" />
        <View style={styles.content}>
          <View style={styles.header}>
            <BrandLogo size={64} />
            <Text style={styles.title}>ささえ愛</Text>
            <Text style={styles.tagline}>障がい・難病当事者による運営</Text>
          </View>

          <Text style={styles.description}>
            障がいや難病への理解を大切にした、{"\n"}
            安心してつながれるマッチングサービスです。
          </Text>

          <Text style={styles.freeNote}>すべての機能を全員無料でご利用いただけます。</Text>

          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push("/(auth)/signup")}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>今から無料で始める</Text>
          </Pressable>

          <Text style={styles.loginHint}>既に登録済みの方はこちら</Text>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.push("/(auth)/login")}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>ログイン</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eff6ff",
    opacity: 0.35,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    marginTop: 16,
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
  },
  tagline: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#db2777",
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: "#374151",
    textAlign: "center",
    marginBottom: 20,
  },
  freeNote: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 36,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#db2777",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  loginHint: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 14,
    color: "#4b5563",
  },
  secondaryBtn: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#db2777",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  secondaryBtnText: {
    color: "#db2777",
    fontSize: 16,
    fontWeight: "700",
  },
})
