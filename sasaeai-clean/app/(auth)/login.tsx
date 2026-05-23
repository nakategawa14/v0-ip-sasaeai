import { BrandLogo } from "@/components/brand/BrandLogo"
import { Link, router, useLocalSearchParams } from "expo-router"
import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAuth } from "@/contexts/AuthContext"
import { isWhitelisted, MAINTENANCE_MODE } from "@/lib/config/maintenance"
import { TABLES } from "@/lib/constants/tables"
import { DATING_SERVICE_DISCLOSURE } from "@/lib/legal/dating-service-disclosure"
import { supabase } from "@/lib/supabase"

export default function LoginScreen() {
  const { blocked: blockedParam } = useLocalSearchParams<{ blocked?: string | string[] }>()
  const blockedNotice =
    blockedParam === "1" ||
    blockedParam === "true" ||
    (Array.isArray(blockedParam) && (blockedParam[0] === "1" || blockedParam[0] === "true"))

  const { session, initialized, accessGateResolved } = useAuth()
  const passwordRef = useRef<TextInput>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialized && session && accessGateResolved) {
      router.replace("/(tabs)")
    }
  }, [initialized, session, accessGateResolved])

  const handleLogin = async () => {
    setError(null)

    if (MAINTENANCE_MODE && !isWhitelisted(email)) {
      setError(
        "現在、サービス準備中のため一般ユーザーのログインを一時停止しております。2025年4月のサービス開始をお待ちください。",
      )
      return
    }

    setLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        if (__DEV__) {
          console.warn("[login] signInWithPassword:", signInError.message, signInError.status)
        }
        setError("メールアドレスまたはパスワードが正しくありません")
        return
      }

      if (data.user) {
        const { data: prof } = await supabase.from(TABLES.PROFILES).select("status").eq("id", data.user.id).maybeSingle()
        if (prof?.status === "blocked") {
          await supabase.auth.signOut()
          setError("このアカウントは管理者により利用停止されています。お問い合わせはサポートまでご連絡ください。")
          return
        }
        router.replace("/(tabs)")
      }
    } catch {
      setError("ログイン中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gradientBg} pointerEvents="none" />
          <View style={styles.card}>
            <View style={styles.header}>
              <Link href="/(tabs)" asChild>
                <Pressable style={styles.brandRow} accessibilityRole="link">
                  <BrandLogo size={52} />
                  <Text style={styles.brandTitle}>ささえ愛</Text>
                </Pressable>
              </Link>
              <Text style={styles.subtitle}>アカウントにログイン</Text>
            </View>

            {blockedNotice ? (
              <View style={styles.alert} accessibilityLiveRegion="polite">
                <Text style={styles.alertText}>
                  このアカウントは利用を停止されています。ご不明点はサポートまでお問い合わせください。
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.alert} accessibilityLiveRegion="polite">
                <Text style={styles.alertText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!loading}
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>パスワード</Text>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                editable={!loading}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityState={{ busy: loading }}
            >
              {loading ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.buttonText}>ログイン中...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>ログイン</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert(
                  "パスワードをお忘れですか？",
                  "パスワードの再設定は、当サービスの案内ページまたはサポートのメールからご案内いたします。詳細は運営にお問い合わせください。",
                )
              }
              style={styles.forgotWrap}
            >
              <Text style={styles.link}>パスワードをお忘れですか？</Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>アカウントをお持ちでない方は</Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable accessibilityRole="link">
                  <Text style={styles.footerLink}>新規登録</Text>
                </Pressable>
              </Link>
            </View>

            <Text style={styles.disclosureFooter} accessibilityRole="text">
              {DATING_SERVICE_DISCLOSURE}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  flex: {
    flex: 1,
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
  card: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#4b5563",
  },
  alert: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  alertText: {
    fontSize: 14,
    color: "#991b1b",
    lineHeight: 20,
  },
  field: {
    marginBottom: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 4,
    backgroundColor: "#db2777",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.85,
  },
  buttonLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotWrap: {
    marginTop: 16,
    alignItems: "center",
  },
  link: {
    fontSize: 14,
    color: "#db2777",
    fontWeight: "500",
  },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: "#4b5563",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#db2777",
  },
  disclosureFooter: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    fontSize: 11,
    lineHeight: 16,
    color: "#6b7280",
    textAlign: "center",
  },
})
