import FontAwesome from "@expo/vector-icons/FontAwesome"
import { Link, router } from "expo-router"
import { useState } from "react"
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

import { isWhitelisted, MAINTENANCE_MODE } from "@/lib/config/maintenance"
import { supabase } from "@/lib/supabase"

export default function SignupScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setError(null)

    if (MAINTENANCE_MODE && !isWhitelisted(email)) {
      setError("現在、サービス準備中のため新規登録を一時停止しております。2025年4月のサービス開始をお待ちください。")
      return
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません")
      return
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください")
      return
    }

    setLoading(true)
    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (signErr) {
        const msg = signErr.message ?? ""
        if (msg.includes("already registered") || msg.includes("User already registered")) {
          setError("このメールアドレスは既に登録されています。ログインしてください。")
          setTimeout(() => router.replace("/(auth)/login"), 2000)
          return
        }
        setError(`登録エラー: ${msg}`)
        return
      }

      if (data.user) {
        if (data.session) {
          router.replace("/verify/identity")
        } else {
          Alert.alert(
            "登録完了",
            "確認メール内のリンクを開いて有効化したあと、ログインしてください。",
            [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
          )
        }
      }
    } catch (e) {
      setError(`登録中にエラーが発生しました: ${e instanceof Error ? e.message : "不明なエラー"}`)
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
              <View style={styles.brandRow}>
                <FontAwesome name="heart" size={32} color="#ec4899" />
                <Text style={styles.brandTitle}>ささえ愛</Text>
              </View>
              <Text style={styles.subtitle}>新規登録</Text>
            </View>

            {error ? (
              <View style={styles.alert}>
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
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>パスワード</Text>
              <TextInput
                style={styles.input}
                placeholder="6文字以上"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>パスワード（確認）</Text>
              <TextInput
                style={styles.input}
                placeholder="パスワードを再入力"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textContentType="newPassword"
                editable={!loading}
              />
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.buttonText}>登録中...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>新規登録</Text>
              )}
            </Pressable>

            <Text style={styles.legal}>
              登録することで、利用規約およびプライバシーポリシーに同意したものとみなされます（詳細は Web 版をご確認ください）。
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerText}>すでにアカウントをお持ちの方は</Text>
              <Link href="/(auth)/login" asChild>
                <Pressable accessibilityRole="link">
                  <Text style={styles.footerLink}>ログイン</Text>
                </Pressable>
              </Link>
            </View>
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
  flex: { flex: 1 },
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
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    alignItems: "center",
    marginBottom: 22,
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
    marginBottom: 14,
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
    marginBottom: 14,
    gap: 6,
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
    marginTop: 6,
    backgroundColor: "#db2777",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonDisabled: { opacity: 0.85 },
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
  legal: {
    marginTop: 14,
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 17,
  },
  footer: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  footerText: { fontSize: 14, color: "#4b5563" },
  footerLink: { fontSize: 14, fontWeight: "600", color: "#db2777" },
})
