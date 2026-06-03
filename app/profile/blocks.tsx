import FontAwesome from "@expo/vector-icons/FontAwesome"
import { useFocusEffect } from "@react-navigation/native"
import { type Href, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAuth } from "@/contexts/AuthContext"
import { removeUserBlock } from "@/lib/blocks/userBlockActions"
import { TABLES } from "@/lib/constants/tables"
import type { SasaeaiProfileRow } from "@/lib/profile/display"
import { supabase } from "@/lib/supabase"

type BlockRow = { blocked_id: string; created_at: string }

type ListItem = {
  blockedId: string
  nickname: string
  createdAt: string
}

export default function BlockedUsersScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([])
      setError("ログインが必要です")
      setLoading(false)
      return
    }

    const { data: rows, error: bErr } = await supabase
      .from(TABLES.BLOCKS)
      .select("blocked_id, created_at")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false })

    if (bErr) {
      setError(bErr.message)
      setItems([])
      setLoading(false)
      return
    }

    const list = (rows ?? []) as BlockRow[]
    const ids = list.map((r) => r.blocked_id).filter(Boolean)
    if (ids.length === 0) {
      setItems([])
      setError(null)
      setLoading(false)
      return
    }

    const { data: profs, error: pErr } = await supabase
      .from(TABLES.PROFILES)
      .select("id,nickname,profile_images,profile_image_url")
      .in("id", ids)

    if (pErr) {
      setError(pErr.message)
      setItems([])
      setLoading(false)
      return
    }

    const byId = new Map<string, SasaeaiProfileRow>()
    for (const p of (profs ?? []) as SasaeaiProfileRow[]) {
      if (p.id) byId.set(String(p.id), p)
    }

    const out: ListItem[] = list.map((r) => {
      const prof = byId.get(r.blocked_id)
      const nick = prof?.nickname && String(prof.nickname).trim() ? String(prof.nickname) : "ユーザー"
      return { blockedId: r.blocked_id, nickname: nick, createdAt: r.created_at }
    })

    setItems(out)
    setError(null)
    setLoading(false)
  }, [user?.id])

  useFocusEffect(
    useCallback(() => {
      let alive = true
      setLoading(true)
      void (async () => {
        await load()
        if (alive) setLoading(false)
      })()
      return () => {
        alive = false
      }
    }, [load]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  const confirmUnblock = (blockedId: string, nickname: string) => {
    Alert.alert("ブロック解除", `「${nickname}」のブロックを解除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "解除する",
        style: "destructive",
        onPress: () => void unblockUser(blockedId),
      },
    ])
  }

  const unblockUser = async (blockedId: string) => {
    if (!user?.id) return
    setBusyId(blockedId)
    const { error: delErr } = await removeUserBlock(supabase, user.id, blockedId)
    setBusyId(null)
    if (delErr) {
      Alert.alert("解除できませんでした", delErr)
      return
    }
    setItems((prev) => prev.filter((x) => x.blockedId !== blockedId))
    Alert.alert("", "ブロックを解除しました。")
  }

  const openUser = (blockedId: string) => {
    router.push({ pathname: "/user/[id]", params: { id: blockedId } } as Href)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.page} edges={["bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#db2777" />
          <Text style={styles.hint}>読み込み中…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.page} edges={["bottom"]}>
      {error ? (
        <View style={styles.errBox}>
          <Text style={styles.errTxt}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(it) => it.blockedId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#db2777"]} />}
        contentContainerStyle={items.length === 0 ? styles.emptyGrow : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="ban" size={40} color="#d1d5db" />
            <Text style={styles.emptyTitle}>ブロック中のユーザーはいません</Text>
            <Text style={styles.emptyBody}>ユーザー詳細の「ブロック」から追加できます。</Text>
          </View>
        }
        renderItem={({ item }) => {
          const busy = busyId === item.blockedId
          return (
            <View style={styles.card}>
              <Pressable style={styles.cardMain} onPress={() => openUser(item.blockedId)} accessibilityRole="button">
                <View style={styles.avatarPh}>
                  <FontAwesome name="user" size={20} color="#db2777" />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.nick} numberOfLines={1}>
                    {item.nickname}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {new Date(item.createdAt).toLocaleString("ja-JP")}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#d1d5db" />
              </Pressable>
              <Pressable
                style={[styles.unblockBtn, busy && styles.unblockBtnDisabled]}
                onPress={() => confirmUnblock(item.blockedId, item.nickname)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="ブロック解除"
              >
                {busy ? (
                  <ActivityIndicator color="#991b1b" size="small" />
                ) : (
                  <Text style={styles.unblockBtnText}>ブロック解除</Text>
                )}
              </Pressable>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fdf2f8" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  hint: { marginTop: 10, color: "#6b7280", fontSize: 14 },
  errBox: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errTxt: { color: "#991b1b", fontSize: 13 },
  list: { padding: 16, paddingBottom: 32 },
  emptyGrow: { flexGrow: 1, padding: 16 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 48 },
  emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: "800", color: "#374151" },
  emptyBody: { marginTop: 8, fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 22, paddingHorizontal: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e0f0",
    marginBottom: 12,
    overflow: "hidden",
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  avatarPh: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fce7f3",
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: { flex: 1, minWidth: 0 },
  nick: { fontSize: 16, fontWeight: "800", color: "#111827" },
  sub: { marginTop: 4, fontSize: 12, color: "#9ca3af" },
  unblockBtn: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  unblockBtnDisabled: { opacity: 0.6 },
  unblockBtnText: { fontSize: 14, fontWeight: "800", color: "#b91c1c" },
})
