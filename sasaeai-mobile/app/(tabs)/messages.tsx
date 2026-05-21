import FontAwesome from "@expo/vector-icons/FontAwesome"
import { useFocusEffect } from "@react-navigation/native"
import { type Href, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAuth } from "@/contexts/AuthContext"
import { TABLES } from "@/lib/constants/tables"
import { isMatchedRow, peerIdFromMatch } from "@/lib/matching/peer"
import { getProfileImageUrl, type SasaeaiProfileRow } from "@/lib/profile/display"
import { supabase } from "@/lib/supabase"

type MatchRow = {
  id: string
  user1_id: string
  user2_id: string
  last_message_at: string | null
  is_active?: boolean | null
  status?: string | null
}

type RoomRow = { id: string; match_id: string }

type MsgRow = {
  id: string
  chat_room_id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
}

type ThreadItem = {
  matchId: string
  roomId: string | null
  peerId: string
  peerNickname: string
  peerAvatar: string | null
  lastContent: string | null
  lastAt: string | null
  unread: number
}

export default function MessagesTabScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [threads, setThreads] = useState<ThreadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) {
      setThreads([])
      setError("ログインが必要です")
      setLoading(false)
      return
    }

    const { data: matches, error: mErr } = await supabase
      .from(TABLES.MATCHES)
      .select("id, user1_id, user2_id, last_message_at, is_active, status")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    if (mErr) {
      setError(mErr.message)
      setThreads([])
      setLoading(false)
      return
    }

    const matchRows = ((matches ?? []) as MatchRow[]).filter(
      (m) => m.is_active !== false && isMatchedRow(m.status),
    )
    if (!matchRows.length) {
      setThreads([])
      setError(null)
      setLoading(false)
      return
    }
    const matchIds = matchRows.map((m) => m.id)
    const peerIds = matchRows.map((m) => peerIdFromMatch(m, user.id))

    const [{ data: rooms }, { data: profiles }] = await Promise.all([
      supabase.from(TABLES.CHAT_ROOMS).select("id, match_id").in("match_id", matchIds),
      supabase.from(TABLES.PROFILES).select("*").in("id", peerIds),
    ])

    const roomIdList = (rooms ?? []).map((r) => (r as RoomRow).id)
    const { data: allMsgs } =
      roomIdList.length > 0
        ? await supabase
            .from(TABLES.CHAT_MESSAGES)
            .select("id, chat_room_id, sender_id, content, created_at, is_read")
            .in("chat_room_id", roomIdList)
            .order("created_at", { ascending: false })
            .limit(300)
        : { data: [] as MsgRow[] }

    const roomByMatch = new Map<string, string>()
    for (const r of (rooms ?? []) as RoomRow[]) {
      roomByMatch.set(r.match_id, r.id)
    }

    const profileById = new Map<string, SasaeaiProfileRow>()
    for (const p of (profiles ?? []) as SasaeaiProfileRow[]) {
      if (p.id) profileById.set(p.id, p)
    }

    const msgs = (allMsgs ?? []) as MsgRow[]
    const roomIds = new Set(Array.from(roomByMatch.values()))
    const msgsInRooms = msgs.filter((m) => roomIds.has(m.chat_room_id))

    const latestByRoom = new Map<string, MsgRow>()
    for (const m of msgsInRooms) {
      if (!latestByRoom.has(m.chat_room_id)) latestByRoom.set(m.chat_room_id, m)
    }

    const unreadByRoom = new Map<string, number>()
    for (const m of msgsInRooms) {
      if (m.sender_id !== user.id && !m.is_read) {
        unreadByRoom.set(m.chat_room_id, (unreadByRoom.get(m.chat_room_id) ?? 0) + 1)
      }
    }

    const out: ThreadItem[] = matchRows.map((m) => {
      const peerId = peerIdFromMatch(m, user.id)
      const prof = profileById.get(peerId)
      const nickname = prof?.nickname && String(prof.nickname).trim() ? String(prof.nickname) : "お相手"
      const peerAvatar = prof ? getProfileImageUrl(prof) : null
      const roomId = roomByMatch.get(m.id) ?? null
      const latest = roomId ? latestByRoom.get(roomId) : undefined
      return {
        matchId: m.id,
        roomId,
        peerId,
        peerNickname: nickname,
        peerAvatar,
        lastContent: latest?.content ?? null,
        lastAt: latest?.created_at ?? m.last_message_at ?? null,
        unread: roomId ? (unreadByRoom.get(roomId) ?? 0) : 0,
      }
    })

    out.sort((a, b) => {
      const ta = a.lastAt ? new Date(a.lastAt).getTime() : 0
      const tb = b.lastAt ? new Date(b.lastAt).getTime() : 0
      return tb - ta
    })

    setThreads(out)
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

  const openChat = (peerId: string) => {
    router.push({ pathname: "/chat/[id]", params: { id: peerId } } as Href)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.page} edges={["top"]}>
        <View style={styles.gradientBg} pointerEvents="none" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#db2777" />
          <Text style={styles.hint}>読み込み中…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.page} edges={["top"]}>
      <View style={styles.gradientBg} pointerEvents="none" />
      <View style={styles.head}>
        <FontAwesome name="comments" size={22} color="#db2777" />
        <Text style={styles.headTitle}>メッセージ</Text>
        <Text style={styles.headSub}>マッチしたお相手とのやり取りです。</Text>
      </View>

      {error ? (
        <View style={styles.errBox}>
          <Text style={styles.errTxt}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={threads}
        keyExtractor={(t) => t.matchId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#db2777"]} />}
        contentContainerStyle={threads.length === 0 ? styles.listEmpty : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="heart" size={48} color="#fbcfe8" />
            <Text style={styles.emptyTitle}>まだマッチがありません</Text>
            <Text style={styles.emptyBody}>「さがす」で気になる人にいいねしてみましょう。</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openChat(item.peerId)} accessibilityRole="button">
            <View style={styles.avatarWrap}>
              {item.peerAvatar ? (
                <Image source={{ uri: item.peerAvatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPh]}>
                  <FontAwesome name="user" size={22} color="#db2777" />
                </View>
              )}
              {item.unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeTxt}>{item.unread > 9 ? "9+" : String(item.unread)}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text style={styles.nick} numberOfLines={1}>
                  {item.peerNickname}
                </Text>
                {item.lastAt ? (
                  <Text style={styles.time}>{new Date(item.lastAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}</Text>
                ) : null}
              </View>
              <Text style={styles.preview} numberOfLines={2}>
                {item.lastContent ?? "メッセージを送ってみましょう"}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#d1d5db" style={styles.chev} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fdf2f8" },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eff6ff",
    opacity: 0.4,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  hint: { marginTop: 10, color: "#6b7280", fontSize: 14 },
  head: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, gap: 6 },
  headTitle: { fontSize: 22, fontWeight: "900", color: "#111827" },
  headSub: { fontSize: 13, color: "#6b7280", lineHeight: 19 },
  errBox: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errTxt: { color: "#991b1b", fontSize: 13 },
  list: { paddingHorizontal: 14, paddingBottom: 24 },
  listEmpty: { flexGrow: 1, paddingHorizontal: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e0f0",
    padding: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#f3f4f6" },
  avatarPh: { justifyContent: "center", alignItems: "center", backgroundColor: "#fce7f3" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#db2777",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },
  cardBody: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  nick: { flex: 1, fontSize: 16, fontWeight: "800", color: "#111827" },
  time: { fontSize: 12, color: "#9ca3af" },
  preview: { marginTop: 4, fontSize: 14, color: "#6b7280", lineHeight: 20 },
  chev: { alignSelf: "center" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: "800", color: "#374151" },
  emptyBody: { marginTop: 8, fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 22 },
})
