import FontAwesome from "@expo/vector-icons/FontAwesome"
import { useFocusEffect } from "@react-navigation/native"
import { type Href, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAuth } from "@/contexts/AuthContext"
import { TABLES } from "@/lib/constants/tables"
import {
  annualIncomeLabel,
  birthDateDisplay,
  calculateAge,
  employmentTypeLabel,
  favoriteAreasJoined,
  genderLabel,
  getProfileImageUrl,
  getSubImageUrls,
  livingSituationLabel,
  parseProfileTags,
  purposeList,
  type SasaeaiProfileRow,
  userTypeLabel,
  verificationStatusLabel,
} from "@/lib/profile/display"
import { clearExpoPushTokenForUser } from "@/lib/notifications/clearExpoPushToken"
import { BETA_FREE_AND_FUTURE_MONETIZATION_NOTICE } from "@/lib/legal/beta-service-notice"
import { UGC_POLICY_SHORT_JA } from "@/lib/legal/ugc-policy"
import {
  openLegalPublicPrivacyInSystemBrowser,
  openLegalPublicTermsEntryInSystemBrowser,
  openLegalPublicTermsInSystemBrowser,
} from "@/lib/linking/legalPublicDocuments"
import { supabase } from "@/lib/supabase"

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<SasaeaiProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

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

  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null)
      setError("ユーザー情報がありません")
      setLoading(false)
      return
    }

    const { data, error: qError } = await supabase
      .from(TABLES.PROFILES)
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (qError) {
      setError(qError.message)
      setProfile(null)
      return
    }

    if (!data) {
      setError(null)
      setProfile(null)
      return
    }

    setProfile(data as SasaeaiProfileRow)
    setError(null)
  }, [user?.id])

  useFocusEffect(
    useCallback(() => {
      let active = true
      setLoading(true)
      ;(async () => {
        await loadProfile()
        if (active) setLoading(false)
      })()
      return () => {
        active = false
      }
    }, [loadProfile]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadProfile()
    setRefreshing(false)
  }, [loadProfile])

  if (loggingOut) {
    return (
      <SafeAreaView style={styles.centered} edges={["top"]}>
        <ActivityIndicator size="large" color="#db2777" />
        <Text style={styles.loadingText}>ログアウト中…</Text>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={["top"]}>
        <ActivityIndicator size="large" color="#db2777" />
        <Text style={styles.loadingText}>プロフィールを読み込み中…</Text>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered} edges={["top"]}>
        <FontAwesome name="exclamation-circle" size={40} color="#dc2626" />
        <Text style={styles.errorTitle}>読み込みに失敗しました</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => loadProfile()}>
          <Text style={styles.retryBtnText}>再試行</Text>
        </Pressable>
        <Pressable style={styles.logoutBtnOutline} onPress={confirmLogout} accessibilityRole="button" accessibilityLabel="ログアウト">
          <FontAwesome name="sign-out" size={16} color="#6b7280" />
          <Text style={styles.logoutBtnOutlineText}>ログアウト</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.emptyScroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <FontAwesome name="user-circle" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>プロフィールが見つかりません</Text>
          <Text style={styles.emptyBody}>ニックネームなどを設定すると、ここに表示されます。</Text>
          <Pressable style={styles.logoutBtnOutline} onPress={confirmLogout} accessibilityRole="button" accessibilityLabel="ログアウト">
            <FontAwesome name="sign-out" size={16} color="#6b7280" />
            <Text style={styles.logoutBtnOutlineText}>ログアウト</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (!profile.nickname?.trim()) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.emptyScroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <Text style={styles.emptyTitle}>プロフィール未完成</Text>
          <Text style={styles.emptyBody}>ニックネームが未設定です。「プロフィールを編集」から登録を完了してください。</Text>
          <Pressable style={styles.logoutBtnOutline} onPress={confirmLogout} accessibilityRole="button" accessibilityLabel="ログアウト">
            <FontAwesome name="sign-out" size={16} color="#6b7280" />
            <Text style={styles.logoutBtnOutlineText}>ログアウト</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const imageUrl = getProfileImageUrl(profile)
  const subImages = getSubImageUrls(profile)
  const tags = parseProfileTags(profile)
  const age = profile.birth_date && typeof profile.birth_date === "string" ? calculateAge(profile.birth_date) : undefined
  const ut = userTypeLabel(typeof profile.user_type === "string" ? profile.user_type : undefined)
  const purposes = purposeList(profile)
  const favAreas = favoriteAreasJoined(typeof profile.favorite_areas === "string" ? profile.favorite_areas : undefined)
  const isSupporter = profile.user_type === "supporter"
  const initials = profile.nickname.slice(0, 2)

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.gradientBg} pointerEvents="none" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#db2777"]} />}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.card}>
          <View style={styles.heroStripe} />
          <View style={styles.avatarWrap}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatar} accessibilityLabel={`${profile.nickname}のプロフィール写真`} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerTextBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.nickname}>{profile.nickname}</Text>
              {profile.is_verified ? (
                <View style={styles.verifiedBadge}>
                  <FontAwesome name="check-circle" size={12} color="#fff" />
                  <Text style={styles.verifiedText}>認証済み</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.metaRow}>
              {age != null ? (
                <View style={styles.metaItemRow}>
                  <FontAwesome name="calendar" size={13} color="#6b7280" />
                  <Text style={styles.metaItem}>{age}歳</Text>
                </View>
              ) : null}
              {profile.gender ? (
                <View style={styles.metaItemRow}>
                  <FontAwesome name="user" size={13} color="#6b7280" />
                  <Text style={styles.metaItem}>{genderLabel(String(profile.gender))}</Text>
                </View>
              ) : null}
              {profile.prefecture ? (
                <View style={[styles.metaItemRow, { flex: 1, minWidth: 140 }]}>
                  <FontAwesome name="map-marker" size={13} color="#6b7280" style={styles.metaIcon} />
                  <Text style={styles.metaItem} numberOfLines={2}>
                    {String(profile.prefecture)}
                    {profile.city ? ` / ${String(profile.city)}` : ""}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <Pressable
          style={styles.editBtn}
          onPress={() => router.push("/profile/edit")}
          accessibilityRole="button"
          accessibilityLabel="プロフィールを編集"
        >
          <FontAwesome name="pencil" size={16} color="#fff" />
          <Text style={styles.editBtnText}>プロフィールを編集</Text>
        </Pressable>

        <Pressable
          style={styles.blocksLink}
          onPress={() => router.push("/profile/blocks" as Href)}
          accessibilityRole="button"
          accessibilityLabel="ブロックしたユーザー一覧"
        >
          <FontAwesome name="ban" size={16} color="#6b7280" />
          <Text style={styles.blocksLinkText}>ブロックしたユーザー一覧</Text>
          <View style={{ flex: 1 }} />
          <FontAwesome name="chevron-right" size={14} color="#d1d5db" />
        </Pressable>

        <Pressable
          style={styles.blocksLink}
          onPress={() => void openLegalPublicTermsEntryInSystemBrowser()}
          accessibilityRole="button"
          accessibilityLabel="利用規約・プライバシーポリシーをブラウザで開く"
        >
          <FontAwesome name="file-text-o" size={16} color="#6b7280" />
          <Text style={styles.blocksLinkText}>利用規約・プライバシーポリシー</Text>
          <View style={{ flex: 1 }} />
          <FontAwesome name="external-link" size={14} color="#d1d5db" />
        </Pressable>

        <Pressable
          style={styles.blocksLink}
          onPress={() => void openLegalPublicTermsInSystemBrowser()}
          accessibilityRole="button"
          accessibilityLabel="利用規約をブラウザで開く"
        >
          <FontAwesome name="file-text-o" size={16} color="#6b7280" />
          <Text style={styles.blocksLinkText}>利用規約</Text>
          <View style={{ flex: 1 }} />
          <FontAwesome name="external-link" size={14} color="#d1d5db" />
        </Pressable>

        <Pressable
          style={styles.blocksLink}
          onPress={() => void openLegalPublicPrivacyInSystemBrowser()}
          accessibilityRole="button"
          accessibilityLabel="プライバシーポリシーをブラウザで開く"
        >
          <FontAwesome name="lock" size={16} color="#6b7280" />
          <Text style={styles.blocksLinkText}>プライバシーポリシー</Text>
          <View style={{ flex: 1 }} />
          <FontAwesome name="external-link" size={14} color="#d1d5db" />
        </Pressable>

        <View style={styles.ekycSection}>
          <Text style={styles.sectionTitle}>本人確認（eKYC）</Text>
          <View style={styles.ekycCard}>
            <InfoRow label="生年月日（登録値）" value={birthDateDisplay(profile.birth_date)} />
            <InfoRow label="本人確認ステータス" value={verificationStatusLabel(profile.verification_status)} />
          </View>
          <Pressable
            style={styles.ekycBtn}
            onPress={() => router.push("/verify/identity")}
            accessibilityRole="button"
            accessibilityLabel="本人確認の撮影画面へ"
          >
            <FontAwesome name="camera" size={18} color="#fff" />
            <Text style={styles.ekycBtnText}>免許証・セルフィーで本人確認</Text>
          </Pressable>
          <Text style={styles.ekycHint}>
            画面上の確認ステータスは、運営の審査状況に応じて更新されます。身分証として運転免許証またはマイナンバーカード（表面）を選べます。
          </Text>
        </View>

        {subImages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>その他の写真</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subImgRow}>
              {subImages.map((uri, i) => (
                <Image key={uri + i} source={{ uri }} style={styles.subImage} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {tags.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>興味・関心タグ</Text>
            <View style={styles.tagWrap}>
              {tags.map((t, i) => (
                <View key={`${t}-${i}`} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>
          <View style={styles.infoCard}>
            {ut ? <InfoRow label="種別" value={ut} /> : null}
            {profile.prefecture ? (
              <InfoRow label="居住地" value={`${String(profile.prefecture)}${profile.city ? ` / ${String(profile.city)}` : ""}`} />
            ) : null}
            {profile.height != null && String(profile.height).trim() !== "" ? (
              <InfoRow label="身長" value={`${String(profile.height)} cm`} />
            ) : null}
            {purposes.length > 0 ? <InfoRow label="目的" value={purposes.join("、")} /> : null}
            {profile.hometown ? <InfoRow label="出身地" value={String(profile.hometown)} /> : null}
            {favAreas ? <InfoRow label="遊びに行く街" value={favAreas} /> : null}
            {profile.favorite_city ? <InfoRow label="好きな街" value={String(profile.favorite_city)} /> : null}
          </View>
        </View>

        {(profile.employment_status ||
          employmentTypeLabel(typeof profile.employment_type === "string" ? profile.employment_type : undefined) ||
          profile.occupation ||
          annualIncomeLabel(typeof profile.annual_income === "string" ? profile.annual_income : undefined)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>就労情報</Text>
            <View style={styles.infoCard}>
              {profile.employment_status ? <InfoRow label="就労状況" value={String(profile.employment_status)} /> : null}
              {employmentTypeLabel(typeof profile.employment_type === "string" ? profile.employment_type : undefined) ? (
                <InfoRow
                  label="就労形態"
                  value={employmentTypeLabel(typeof profile.employment_type === "string" ? profile.employment_type : undefined)!}
                />
              ) : null}
              {profile.occupation ? <InfoRow label="職業" value={String(profile.occupation)} /> : null}
              {annualIncomeLabel(typeof profile.annual_income === "string" ? profile.annual_income : undefined) ? (
                <InfoRow
                  label="年収"
                  value={annualIncomeLabel(typeof profile.annual_income === "string" ? profile.annual_income : undefined)!}
                />
              ) : null}
            </View>
          </View>
        )}

        {(livingSituationLabel(typeof profile.living_situation === "string" ? profile.living_situation : undefined) ||
          profile.family_relationship ||
          (!isSupporter && profile.can_go_out_alone !== undefined) ||
          (!isSupporter && profile.independence_level)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>生活状況</Text>
            <View style={styles.infoCard}>
              {livingSituationLabel(typeof profile.living_situation === "string" ? profile.living_situation : undefined) ? (
                <InfoRow
                  label="住まい"
                  value={livingSituationLabel(typeof profile.living_situation === "string" ? profile.living_situation : undefined)!}
                />
              ) : null}
              {profile.family_relationship ? <InfoRow label="家族関係" value={String(profile.family_relationship)} /> : null}
              {!isSupporter && profile.can_go_out_alone !== undefined ? (
                <InfoRow label="外出" value={profile.can_go_out_alone ? "一人で外出できる" : "サポートが必要"} />
              ) : null}
              {!isSupporter && profile.independence_level ? (
                <InfoRow label="自立度" value={String(profile.independence_level)} />
              ) : null}
            </View>
          </View>
        )}

        {isSupporter && profile.supporter_message ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>サポーターメッセージ</Text>
            <View style={styles.bioCard}>
              <Text style={styles.bioText}>{String(profile.supporter_message)}</Text>
            </View>
          </View>
        ) : null}

        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>自己紹介</Text>
            <View style={styles.bioCard}>
              <Text style={styles.bioText}>{String(profile.bio)}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.betaNotice} accessibilityRole="text">
          <FontAwesome name="info-circle" size={16} color="#b45309" style={styles.betaNoticeIcon} />
          <Text style={styles.betaNoticeText}>{BETA_FREE_AND_FUTURE_MONETIZATION_NOTICE}</Text>
        </View>

        <View style={styles.ugcNotice} accessibilityRole="text">
          <FontAwesome name="shield" size={16} color="#1d4ed8" style={styles.betaNoticeIcon} />
          <Text style={styles.ugcNoticeText}>{UGC_POLICY_SHORT_JA}</Text>
        </View>

        <Pressable
          style={styles.logoutBtnOutline}
          onPress={confirmLogout}
          accessibilityRole="button"
          accessibilityLabel="ログアウト"
        >
          <FontAwesome name="sign-out" size={16} color="#6b7280" />
          <Text style={styles.logoutBtnOutlineText}>ログアウト</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eff6ff",
    opacity: 0.4,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: "#fdf2f8",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6b7280",
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#991b1b",
  },
  errorBody: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: "#db2777",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyScroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  emptyBody: {
    marginTop: 10,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 22,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    marginBottom: 16,
  },
  heroStripe: {
    height: 96,
    backgroundColor: "#f472b6",
  },
  avatarWrap: {
    marginTop: -48,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#fce7f3",
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "700",
    color: "#db2777",
  },
  headerTextBlock: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  nickname: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 10,
    alignItems: "flex-start",
  },
  metaItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaIcon: {
    marginTop: 2,
  },
  metaItem: {
    fontSize: 14,
    color: "#6b7280",
    flexShrink: 1,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#db2777",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#fce7f3",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  editBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  blocksLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  blocksLinkText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
  },
  ekycSection: {
    marginBottom: 20,
  },
  ekycCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  ekycBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
  },
  ekycBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  ekycHint: {
    marginTop: 10,
    fontSize: 11,
    color: "#9ca3af",
    lineHeight: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  subImgRow: {
    gap: 10,
    paddingVertical: 4,
  },
  subImage: {
    width: 112,
    height: 112,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    backgroundColor: "#fce7f3",
    borderWidth: 1,
    borderColor: "#f9a8d4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagChipText: {
    fontSize: 13,
    color: "#9d174d",
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 12,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  infoValue: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
  },
  bioCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
  },
  bioText: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
  },
  logoutBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignSelf: "center",
  },
  logoutBtnOutlineText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
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
    marginTop: 4,
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
  ugcNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  ugcNoticeText: {
    flex: 1,
    fontSize: 13,
    color: "#1e3a8a",
    lineHeight: 20,
  },
})
