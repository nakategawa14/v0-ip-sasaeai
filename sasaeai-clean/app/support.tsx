import FontAwesome from "@expo/vector-icons/FontAwesome"
import { Stack, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAuth } from "@/contexts/AuthContext"
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from "@supabase/supabase-js"
import { DATING_SERVICE_DISCLOSURE } from "@/lib/legal/dating-service-disclosure"
import { CONTACT_DISPLAY_LINE, OPERATOR_INFO, SUPPORT_MAILTO } from "@/lib/legal/operator-info"
import { UGC_POLICY_SHORT_JA } from "@/lib/legal/ugc-policy"
import {
  openLegalPublicPrivacyInSystemBrowser,
  openLegalPublicTermsEntryInSystemBrowser,
  openLegalPublicTermsInSystemBrowser,
} from "@/lib/linking/legalPublicDocuments"
import { buildPublicSitePageUrl, resolvePublicSiteOrigin } from "@/lib/linking/public-site-url"
import { clearExpoPushTokenForUser } from "@/lib/notifications/clearExpoPushToken"
import { supabase } from "@/lib/supabase"

function MenuRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon:
    | "file-text-o"
    | "lock"
    | "institution"
    | "building-o"
    | "question-circle"
    | "envelope-o"
    | "sign-out"
    | "user-times"
    | "shield"
  label: string
  onPress: () => void
  danger?: boolean
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, danger && styles.rowDanger]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <FontAwesome name={icon} size={20} color={danger ? "#dc2626" : "#db2777"} />
      <Text style={[styles.rowText, danger && styles.rowTextDanger]}>{label}</Text>
      <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
    </Pressable>
  )
}

export default function SupportScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [leaving, setLeaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const openUrl = useCallback(async (path: "/terms" | "/privacy" | "/legal" | "/faq" | "/safety") => {
    const origin = resolvePublicSiteOrigin()
    const fullUrl = buildPublicSitePageUrl(path)
    const isHttp = /^https?:\/\//i.test(fullUrl)

    console.log("[support] openUrl request", {
      path,
      origin,
      fullUrl,
      platform: Platform.OS,
      isHttp,
    })

    let canOpen = false
    try {
      canOpen = await Linking.canOpenURL(fullUrl)
    } catch (e) {
      console.warn("[support] canOpenURL threw", { fullUrl, error: String(e) })
    }

    console.log("[support] canOpenURL result", { fullUrl, canOpen, platform: Platform.OS })

    const tryOpen = async () => {
      await Linking.openURL(fullUrl)
    }

    try {
      if (canOpen) {
        await tryOpen()
        return
      }
      if (isHttp) {
        console.warn(
          "[support] canOpenURL=false; trying Linking.openURL anyway (Android 11+ などで canOpenURL が誤判定になることがあります)",
          { fullUrl },
        )
        await tryOpen()
        return
      }
      console.warn("[support] unsupported scheme, abort", { fullUrl })
      Alert.alert("エラー", "この端末では URL を開けませんでした。")
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn("[support] Linking.openURL failed", { fullUrl, error: msg, platform: Platform.OS })
      Alert.alert("エラー", `URL を開けませんでした。\n\n試行したURL:\n${fullUrl}`)
    }
  }, [])

  const openMail = useCallback(() => {
    void Linking.openURL(SUPPORT_MAILTO)
  }, [])

  const confirmLogout = useCallback(() => {
    Alert.alert("ログアウト", "ログアウトしてもよろしいですか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setLoggingOut(true)
            try {
              if (user?.id) {
                await clearExpoPushTokenForUser(user.id)
              }
              await supabase.auth.signOut()
            } finally {
              setLoggingOut(false)
              router.replace("/(auth)/login")
            }
          })()
        },
      },
    ])
  }, [router, user?.id])

  const confirmDelete = useCallback(() => {
    if (!user?.id) {
      Alert.alert("エラー", "ログイン情報が見つかりません。")
      return
    }
    Alert.alert("退会の確認", "データが削除されますがよろしいですか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "退会する",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setLeaving(true)
            const { error } = await supabase.functions.invoke("delete-account", {
              body: {},
            })
            if (error) {
              setLeaving(false)
              if (error instanceof FunctionsHttpError) {
                const payload = await error.context.json().catch(() => null)
                const msg = typeof payload?.error === "string" ? payload.error : "退会に失敗しました"
                Alert.alert("エラー", msg)
              } else if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
                Alert.alert("エラー", "通信エラーのため退会に失敗しました。時間をおいて再度お試しください。")
              } else {
                Alert.alert("エラー", error.message ?? "退会に失敗しました")
              }
              return
            }
            await supabase.auth.signOut()
            setLeaving(false)
            router.replace("/(auth)/login")
          })()
        },
      },
    ])
  }, [router, user?.id])

  return (
    <>
      <Stack.Screen
        options={{
          title: "設定・ヘルプ",
          headerBackTitle: "戻る",
          headerTintColor: "#db2777",
          headerStyle: { backgroundColor: "#fff" },
          headerTitleStyle: { fontWeight: "700", color: "#111827" },
        }}
      />
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        {leaving || loggingOut ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#db2777" />
            <Text style={styles.loadingText}>{loggingOut ? "ログアウト中…" : "退会処理中…"}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.cardTitle}>運営情報（特商法に含める）</Text>
              <Text style={styles.meta}>
                運営：{OPERATOR_INFO.name}
                {"\n"}
                責任者：{OPERATOR_INFO.representative}
                {"\n"}
                住所：{OPERATOR_INFO.address}
                {"\n"}
                連絡先：{OPERATOR_INFO.email}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>安全に使うために</Text>
              <Text style={styles.meta}>
                出会い系サービスを安心してご利用いただくため、トラブル防止のポイントをまとめたページを用意しています（Web で閲覧できます）。
              </Text>
              <Text style={[styles.meta, { marginTop: 10 }]} accessibilityRole="text">
                {UGC_POLICY_SHORT_JA}
              </Text>
            </View>

            <MenuRow icon="shield" label="安全ガイドライン" onPress={() => void openUrl("/safety")} />

            <MenuRow
              icon="file-text-o"
              label="利用規約・プライバシーポリシー"
              onPress={() => void openLegalPublicTermsEntryInSystemBrowser()}
            />

            <MenuRow icon="file-text-o" label="利用規約" onPress={() => void openLegalPublicTermsInSystemBrowser()} />
            <MenuRow icon="lock" label="プライバシーポリシー" onPress={() => void openLegalPublicPrivacyInSystemBrowser()} />
            <MenuRow icon="institution" label="特定商取引法" onPress={() => void openUrl("/legal")} />
            <MenuRow icon="question-circle" label="よくある質問" onPress={() => void openUrl("/faq")} />
            <MenuRow icon="envelope-o" label="運営にメール" onPress={openMail} />
            <Text style={styles.contactBelowMail} accessibilityRole="text">
              {CONTACT_DISPLAY_LINE}
            </Text>
            <MenuRow icon="sign-out" label="ログアウト" onPress={confirmLogout} />
            <MenuRow icon="user-times" label="退会する" onPress={confirmDelete} danger />

            <Pressable style={styles.mutedRow} onPress={() => router.push("/modal")} accessibilityRole="button">
              <FontAwesome name="info-circle" size={18} color="#6b7280" />
              <Text style={styles.mutedText}>アプリ情報（モーダル）</Text>
            </Pressable>

            <Text style={styles.disclosureFooter} accessibilityRole="text">
              {DATING_SERVICE_DISCLOSURE}
            </Text>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  scroll: {
    padding: 18,
    paddingBottom: 32,
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: "#4b5563",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e0f0",
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  meta: {
    fontSize: 13,
    lineHeight: 20,
    color: "#4b5563",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e0f0",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  rowPressed: {
    opacity: 0.92,
  },
  rowDanger: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  rowTextDanger: {
    color: "#b91c1c",
  },
  contactBelowMail: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  mutedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingVertical: 10,
  },
  mutedText: {
    fontSize: 14,
    color: "#6b7280",
  },
})
