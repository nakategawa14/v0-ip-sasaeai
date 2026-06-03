import FontAwesome from "@expo/vector-icons/FontAwesome"
import { StatusBar } from "expo-status-bar"
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"

import { UGC_POLICY_SHORT_JA } from "@/lib/legal/ugc-policy"
import { openLegalPublicTermsEntryInSystemBrowser } from "@/lib/linking/legalPublicDocuments"

export default function ModalScreen() {
  return (
    <View style={styles.root}>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <FontAwesome name="heart" size={40} color="#db2777" />
          <Text style={styles.title}>ささえ愛</Text>
          <Text style={styles.subtitle}>アプリについて</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ユーザー投稿（UGC）について</Text>
          <Text style={styles.body}>{UGC_POLICY_SHORT_JA}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>利用規約・プライバシー</Text>
          <Text style={styles.body}>詳細は公式サイトのページをご覧ください。</Text>
          <Pressable
            style={styles.linkBtn}
            onPress={() => void openLegalPublicTermsEntryInSystemBrowser()}
            accessibilityRole="button"
            accessibilityLabel="利用規約・プライバシーポリシーをブラウザで開く"
          >
            <FontAwesome name="external-link" size={16} color="#fff" />
            <Text style={styles.linkBtnText}>利用規約・プライバシーポリシー（公式サイト）</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  hero: {
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e0f0",
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
  },
  linkBtn: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#db2777",
    paddingVertical: 14,
    borderRadius: 12,
  },
  linkBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
})
