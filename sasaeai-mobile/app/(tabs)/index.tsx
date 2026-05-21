import FontAwesome from "@expo/vector-icons/FontAwesome"
import { useFocusEffect } from "@react-navigation/native"
import { useRouter } from "expo-router"
import { useCallback, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { UserGridCard } from "@/components/matching/UserGridCard"
import { useAuth } from "@/contexts/AuthContext"
import { TABLES } from "@/lib/constants/tables"
import type { SasaeaiProfileRow } from "@/lib/profile/display"
import { supabase } from "@/lib/supabase"
import { brandScreen } from "@/lib/theme/brandScreen"

const H_PAD = 14
const COL_GAP = 10

export default function MatchListScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<SasaeaiProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState<boolean | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const screenW = Dimensions.get("window").width
  const cardWidth = useMemo(() => (screenW - H_PAD * 2 - COL_GAP) / 2, [screenW])

  const loadProfiles = useCallback(async () => {
    if (!user?.id) {
      setProfiles([])
      setError("ログインが必要です")
      return
    }

    const { data: me, error: meErr } = await supabase
      .from(TABLES.PROFILES)
      .select("id, is_verified")
      .eq("id", user.id)
      .maybeSingle()

    if (meErr || !me) {
      setError("プロフィールが見つかりません。Web 版またはプロフィール編集で登録してください。")
      setProfiles([])
      setVerified(null)
      return
    }

    setVerified(!!me.is_verified)

    const [{ data: blockedA }, { data: blockedB }] = await Promise.all([
      supabase.from(TABLES.BLOCKS).select("blocked_id").eq("blocker_id", me.id),
      supabase.from(TABLES.BLOCKS).select("blocker_id").eq("blocked_id", me.id),
    ])

    const blocked = new Set<string>([
      ...(blockedA ?? []).map((r) => r.blocked_id as string),
      ...(blockedB ?? []).map((r) => r.blocker_id as string),
    ])

    const { data: rows, error: qErr } = await supabase
      .from(TABLES.PROFILES)
      .select("*")
      .neq("id", me.id)
      .order("created_at", { ascending: false })
      .limit(60)

    if (qErr) {
      setError(qErr.message)
      setProfiles([])
      return
    }

    let list = (rows ?? []) as SasaeaiProfileRow[]
    list = list.filter((p) => p.id && p.nickname && p.gender)
    list = list.filter((p) => p.is_active !== false)
    list = list.filter((p) => !blocked.has(p.id))

    setProfiles(list)
    setError(null)
  }, [user?.id])

  useFocusEffect(
    useCallback(() => {
      let alive = true
      setLoading(true)
      ;(async () => {
        await loadProfiles()
        if (alive) setLoading(false)
      })()
      return () => {
        alive = false
      }
    }, [loadProfiles]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadProfiles()
    setRefreshing(false)
  }, [loadProfiles])

  const openProfile = useCallback(
    (id: string) => {
      router.push({ pathname: "/user/[id]", params: { id } })
    },
    [router],
  )

  const logout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
    } finally {
      setLoggingOut(false)
      router.replace("/(auth)/login")
    }
  }, [router])

  if (loading) {
    return (
      <SafeAreaView style={brandScreen.pageTint} edges={["top"]}>
        <View style={brandScreen.gradientBg} pointerEvents="none" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#db2777" />
          <Text style={styles.loadingText}>読み込み中…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={brandScreen.pageTint} edges={["top"]}>
      <View style={brandScreen.gradientBg} pointerEvents="none" />
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#db2777"]} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <FontAwesome name="heart" size={22} color="#ec4899" />
              <Text style={styles.title}>さがす</Text>
            </View>
            <Text style={styles.subtitle}>お相手を見つけましょう（Web 版の「さがす」に相当）</Text>

            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
              onPress={() => void logout()}
              disabled={loggingOut}
              accessibilityRole="button"
              accessibilityLabel="強制ログアウト"
              accessibilityState={{ disabled: loggingOut, busy: loggingOut }}
            >
              {loggingOut ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <FontAwesome name="sign-out" size={18} color="#111827" />
              )}
              <Text style={styles.logoutText}>強制ログアウト</Text>
            </Pressable>

            {verified === false ? (
              <View style={styles.verifyBanner}>
                <FontAwesome name="lock" size={20} color="#c2410c" />
                <View style={styles.verifyTextWrap}>
                  <Text style={styles.verifyTitle}>本人確認が完了すると便利です</Text>
                  <Text style={styles.verifyBody}>
                    Web 版と同様、本人確認後は検索・いいねなどがスムーズになります。eKYC はプロフィールタブから利用できます。
                  </Text>
                </View>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>表示できるユーザーがいません</Text>
              <Text style={styles.emptySub}>ブロック設定やプロフィール条件をご確認ください。</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <UserGridCard profile={item} cardWidth={cardWidth} onPress={() => openProfile(item.id)} />
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6b7280",
  },
  listContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 24,
  },
  row: {
    justifyContent: "space-between",
    columnGap: COL_GAP,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  logoutButtonPressed: {
    opacity: 0.92,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  verifyBanner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  verifyTextWrap: {
    flex: 1,
  },
  verifyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#9a3412",
    marginBottom: 4,
  },
  verifyBody: {
    fontSize: 12,
    color: "#c2410c",
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 13,
    lineHeight: 19,
  },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    paddingHorizontal: 20,
  },
})
