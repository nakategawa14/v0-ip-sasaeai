import FontAwesome from "@expo/vector-icons/FontAwesome"
import { Link, type Href, useRouter } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { BrandLogo } from "@/components/brand/BrandLogo"
import { useAuth } from "@/contexts/AuthContext"
import { BETA_FREE_AND_FUTURE_MONETIZATION_NOTICE } from "@/lib/legal/beta-service-notice"
import { CONTACT_DISPLAY_LINE } from "@/lib/legal/operator-info"
import { brandScreen } from "@/lib/theme/brandScreen"

export default function HomeTabScreen() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <SafeAreaView style={brandScreen.pageTint} edges={["top"]}>
      <View style={brandScreen.gradientBg} pointerEvents="none" />
      <View style={styles.inner}>
        <View style={styles.hero}>
          <BrandLogo size={56} />
          <Text style={styles.title}>ささえ愛</Text>
          <Text style={styles.sub}>つながりを大切にするマッチングのホームです。</Text>
        </View>

        <View style={brandScreen.card}>
          <Text style={brandScreen.sectionTitle}>ようこそ</Text>
          <Text style={styles.p}>
            {user?.email ? `${user.email} でログイン中` : "ログイン中"}
          </Text>
        </View>

        <View style={styles.betaNotice} accessibilityRole="text">
          <FontAwesome name="info-circle" size={16} color="#b45309" style={styles.betaNoticeIcon} />
          <Text style={styles.betaNoticeText}>{BETA_FREE_AND_FUTURE_MONETIZATION_NOTICE}</Text>
        </View>

        <Pressable
          style={styles.row}
          onPress={() => router.push("/(tabs)" as Href)}
          accessibilityRole="button"
        >
          <FontAwesome name="search" size={20} color="#db2777" />
          <Text style={styles.rowText}>さがす（ユーザー一覧）</Text>
          <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={() => router.push("/(tabs)/messages" as Href)}
          accessibilityRole="button"
        >
          <FontAwesome name="comments" size={20} color="#ec4899" />
          <Text style={styles.rowText}>メッセージ</Text>
          <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={() => router.push("/(tabs)/profile" as Href)}
          accessibilityRole="button"
        >
          <FontAwesome name="user" size={20} color="#2563eb" />
          <Text style={styles.rowText}>マイプロフィール</Text>
          <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
        </Pressable>

        <Pressable style={styles.row} onPress={() => router.push("/profile/edit" as Href)} accessibilityRole="button">
          <FontAwesome name="pencil" size={20} color="#7c3aed" />
          <Text style={styles.rowText}>プロフィールを編集</Text>
          <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
        </Pressable>

        <Pressable style={styles.row} onPress={() => router.push("/verify/identity")} accessibilityRole="button">
          <FontAwesome name="camera" size={20} color="#0d9488" />
          <Text style={styles.rowText}>本人確認（eKYC）</Text>
          <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
        </Pressable>

        <Link href="/modal" asChild>
          <Pressable style={styles.rowMuted} accessibilityRole="button">
            <FontAwesome name="info-circle" size={18} color="#6b7280" />
            <Text style={styles.rowMutedText}>アプリ情報（モーダル）</Text>
          </Pressable>
        </Link>

        <View style={styles.footerSpacer} />
        <Text style={styles.contactFooter} accessibilityRole="text">
          {CONTACT_DISPLAY_LINE}
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },
  hero: {
    marginBottom: 20,
    gap: 8,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
  },
  sub: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 21,
  },
  p: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
  },
  betaNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  betaNoticeIcon: {
    marginTop: 2,
  },
  betaNoticeText: {
    flex: 1,
    fontSize: 13,
    color: "#78350f",
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e0f0",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  rowMuted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  rowMutedText: {
    fontSize: 14,
    color: "#6b7280",
  },
  footerSpacer: {
    flex: 1,
    minHeight: 16,
  },
  contactFooter: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
})
