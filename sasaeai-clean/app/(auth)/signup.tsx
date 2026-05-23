import { BrandLogo } from "@/components/brand/BrandLogo"
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

import { LegalPolicyPressableLink } from "@/components/legal/LegalPolicyPressableLink"
import { isWhitelisted, MAINTENANCE_MODE } from "@/lib/config/maintenance"
import { DATING_SERVICE_DISCLOSURE } from "@/lib/legal/dating-service-disclosure"
import { supabase } from "@/lib/supabase"

export default function SignupScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setError(null)

    if (!agreedToTerms) {
      setError("利用規約とプライバシーポリシーに同意してください")
      return
    }

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
                <BrandLogo size={52} />
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

            <View style={styles.consentBlock}>
              <Pressable
                style={styles.consentRow}
                onPress={() => setAgreedToTerms((v) => !v)}
                disabled={loading}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreedToTerms }}
                accessibilityLabel="利用規約とプライバシーポリシーに同意します"
              >
                <View style={[styles.checkboxOuter, agreedToTerms && styles.checkboxOuterOn]}>
                  {agreedToTerms ? <View style={styles.checkboxInner} /> : null}
                </View>
                <Text style={styles.consentMainText}>利用規約とプライバシーポリシーに同意します</Text>
              </Pressable>
              <View style={styles.consentLinksRow}>
                <Text style={styles.consentHint}>全文は各ページでご確認ください。 </Text>
                <LegalPolicyPressableLink kind="terms" textStyle={styles.consentLink} />
                <Text style={styles.consentHint}>・</Text>
                <LegalPolicyPressableLink kind="privacy" textStyle={styles.consentLink} />
              </View>
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
              「新規登録」を押すと、上記の同意内容に加え、利用規約およびプライバシーポリシーに同意したものとみなされます。
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerText}>すでにアカウントをお持ちの方は</Text>
              <Link href="/(auth)/login" asChild>
                <Pressable accessibilityRole="link">
                  <Text style={styles.footerLink}>ログイン</Text>
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
  consentBlock: {
    marginBottom: 4,
    paddingVertical: 4,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxOuterOn: {
    borderColor: "#db2777",
    backgroundColor: "#fdf2f8",
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "#db2777",
  },
  consentMainText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 22,
  },
  consentLinksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingLeft: 34,
    paddingBottom: 4,
    gap: 2,
  },
  consentHint: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 20,
  },
  consentLink: {
    fontSize: 12,
    color: "#db2777",
    fontWeight: "700",
    textDecorationLine: "underline",
    lineHeight: 20,
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
