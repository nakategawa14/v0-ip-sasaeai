import FontAwesome from "@expo/vector-icons/FontAwesome"
import { Stack, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAuth } from "@/contexts/AuthContext"
import { webLegalUrl } from "@/lib/config/site-url"
import { OPERATOR_INFO, SUPPORT_MAILTO } from "@/lib/legal/operator-info"
import { TABLES } from "@/lib/constants/tables"
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

  const openUrl = useCallback(async (path: Parameters<typeof webLegalUrl>[0]) => {
    const url = webLegalUrl(path)
    if (!url) {
      Alert.alert(
        "Web の URL が未設定です",
        "sasaeai-mobile/.env に EXPO_PUBLIC_SITE_URL（例: https://example.com）を設定すると、ブラウザで規約ページを開けます。",
      )
      return
    }
    const supported = await Linking.canOpenURL(url)
    if (!supported) {
      Alert.alert("エラー", "この端末では URL を開けませんでした。")
      return
    }
    await Linking.openURL(url)
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
              await supabase.auth.signOut()
            } finally {
              setLoggingOut(false)
              router.replace("/(auth)/login")
            }
          })()
        },
      },
    ])
  }, [router])

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
            const { error } = await supabase
              .from(TABLES.PROFILES)
              .update({
                is_active: false,
                deleted_at: new Date().toISOString(),
              })
              .eq("id", user.id)
            if (error) {
              setLeaving(false)
              Alert.alert("エラー", error.message ?? "退会に失敗しました")
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

            <MenuRow icon="file-text-o" label="利用規約" onPress={() => void openUrl("/legal/terms")} />
            <MenuRow icon="lock" label="プライバシーポリシー" onPress={() => void openUrl("/legal/privacy")} />
            <MenuRow icon="institution" label="特定商取引法に基づく表記" onPress={() => void openUrl("/legal/tokushoho")} />
            <MenuRow icon="building-o" label="運営情報（詳細ページ）" onPress={() => void openUrl("/legal/company")} />
            <MenuRow icon="question-circle" label="よくある質問 / 使い方 / 安全" onPress={() => void openUrl("/help")} />
            <MenuRow icon="envelope-o" label="運営にメール" onPress={openMail} />
            <MenuRow icon="sign-out" label="ログアウト" onPress={confirmLogout} />
            <MenuRow icon="user-times" label="退会する" onPress={confirmDelete} danger />

            <Pressable style={styles.mutedRow} onPress={() => router.push("/modal")} accessibilityRole="button">
              <FontAwesome name="info-circle" size={18} color="#6b7280" />
              <Text style={styles.mutedText}>アプリ情報（モーダル）</Text>
            </Pressable>
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
