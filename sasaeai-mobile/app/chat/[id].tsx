import { useFocusEffect } from "@react-navigation/native"
import { useHeaderHeight } from "@react-navigation/elements"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { StackBackButton } from "@/components/navigation/StackBackButton"
import { useAuth } from "@/contexts/AuthContext"
import { TABLES } from "@/lib/constants/tables"
import { supabase } from "@/lib/supabase"

type ChatMessageRow = {
  id: string
  chat_room_id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
}

const bubble = {
  meBg: "#fce7f3",
  meBorder: "#f472b6",
  themBg: "#ffffff",
  themBorder: "#93c5fd",
  page: "#fdf2f8",
  accent: "#db2777",
  text: "#111827",
  sub: "#6b7280",
}

export default function ChatConversationScreen() {
  const { id: peerId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()

  const [roomId, setRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageRow[]>([])
  const [peerNickname, setPeerNickname] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState("")
  const idsRef = useRef<Set<string>>(new Set())

  const myId = user?.id

  const mergeIncoming = useCallback((row: ChatMessageRow) => {
    setMessages((prev) => {
      if (idsRef.current.has(row.id)) return prev
      idsRef.current.add(row.id)
      const next = [...prev, row].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      return next
    })
  }, [])

  const markAsRead = useCallback(
    async (rid: string) => {
      if (!myId) return
      await supabase
        .from(TABLES.CHAT_MESSAGES)
        .update({ is_read: true })
        .eq("chat_room_id", rid)
        .neq("sender_id", myId)
        .eq("is_read", false)
    },
    [myId],
  )

  const bootstrap = useCallback(async () => {
    if (!myId || !peerId || peerId === myId) {
      setLoading(false)
      return
    }

    setLoading(true)
    idsRef.current = new Set()

    const { data: peerRow } = await supabase.from(TABLES.PROFILES).select("nickname").eq("id", peerId).maybeSingle()
    setPeerNickname(typeof peerRow?.nickname === "string" ? peerRow.nickname : "お相手")

    const { data: rid, error: rpcErr } = await supabase.rpc("sasaeai_ensure_chat_room_for_peer", { p_peer_id: peerId })

    if (rpcErr || !rid) {
      setLoading(false)
      Alert.alert(
        "チャットを開けません",
        "相互の「いいね！」でマッチ（matched）になったお相手とのみメッセージできます。プロフィールでいいねして、相手からもいいねが届くのを待ちましょう。",
        [{ text: "OK", onPress: () => router.back() }],
      )
      return
    }

    const room = rid as string
    setRoomId(room)

    const { data: rows, error: qErr } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .select("id, chat_room_id, sender_id, content, created_at, is_read")
      .eq("chat_room_id", room)
      .order("created_at", { ascending: true })
      .limit(200)

    if (qErr) {
      Alert.alert("読み込みエラー", qErr.message)
      setLoading(false)
      return
    }

    const list = (rows ?? []) as ChatMessageRow[]
    idsRef.current = new Set(list.map((m) => m.id))
    setMessages(list)
    await markAsRead(room)
    setLoading(false)
  }, [myId, peerId, router, markAsRead])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  useEffect(() => {
    if (!roomId || !myId) return

    const channel = supabase
      .channel(`dm-messages-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TABLES.CHAT_MESSAGES,
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload: RealtimePostgresChangesPayload<ChatMessageRow>) => {
          const row = payload.new as ChatMessageRow
          if (row?.id) mergeIncoming(row)
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [roomId, myId, mergeIncoming])

  useFocusEffect(
    useCallback(() => {
      if (roomId) void markAsRead(roomId)
    }, [roomId, markAsRead]),
  )

  const flatData = useMemo(() => [...messages].reverse(), [messages])

  const send = async () => {
    const text = draft.trim()
    if (!text || !roomId || !myId || sending) return
    setSending(true)
    setDraft("")

    const { data, error } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .insert({ chat_room_id: roomId, sender_id: myId, content: text })
      .select("id, chat_room_id, sender_id, content, created_at, is_read")
      .single()

    setSending(false)

    if (error) {
      Alert.alert("送信できませんでした", error.message)
      setDraft(text)
      return
    }

    if (data) mergeIncoming(data as ChatMessageRow)
  }

  const keyboardOffset = useMemo(() => {
    if (Platform.OS === "ios") return headerHeight
    return insets.top + 56
  }, [headerHeight, insets.top])

  const headerOptions = useMemo(
    () => ({
      title: peerNickname || "メッセージ",
      headerLeft: () => <StackBackButton />,
    }),
    [peerNickname],
  )

  const renderItem = useCallback(
    ({ item }: { item: ChatMessageRow }) => {
      const mine = item.sender_id === myId
      return (
        <View style={[styles.row, mine ? styles.rowMine : styles.rowThem]}>
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleThem]}>
            <Text style={styles.bubbleText}>{item.content}</Text>
            <Text style={styles.time}>
              {new Date(item.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </View>
      )
    },
    [myId],
  )

  if (!peerId) {
    return (
      <SafeAreaView style={styles.page} edges={["bottom"]}>
        <Stack.Screen options={{ title: "メッセージ", headerLeft: () => <StackBackButton /> }} />
        <Text style={styles.err}>相手が指定されていません</Text>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.page} edges={["bottom"]}>
        <Stack.Screen options={headerOptions} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={bubble.accent} />
          <Text style={styles.hint}>読み込み中…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.page} edges={["bottom"]}>
      <Stack.Screen options={headerOptions} />
      <View style={styles.gradientBg} pointerEvents="none" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardOffset}
      >
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>やり取りを始めましょう</Text>
              <Text style={styles.emptySub}>一言挨拶を送ってみてください。相手の画面にすぐ表示されます。</Text>
            </View>
          }
        />

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="メッセージを入力…"
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={2000}
            editable={!sending && !!roomId}
          />
          <Pressable
            style={[styles.sendBtn, (!draft.trim() || sending || !roomId) && styles.sendBtnOff]}
            onPress={() => void send()}
            disabled={!draft.trim() || sending || !roomId}
            accessibilityRole="button"
            accessibilityLabel="送信"
          >
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendBtnText}>送信</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: bubble.page },
  flex: { flex: 1 },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eff6ff",
    opacity: 0.35,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  hint: { marginTop: 10, color: bubble.sub, fontSize: 14 },
  err: { padding: 24, color: "#991b1b" },
  listContent: { paddingHorizontal: 12, paddingVertical: 16, flexGrow: 1 },
  row: { marginBottom: 10, flexDirection: "row" },
  rowMine: { justifyContent: "flex-end" },
  rowThem: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleMine: {
    backgroundColor: bubble.meBg,
    borderColor: bubble.meBorder,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: bubble.themBg,
    borderColor: bubble.themBorder,
    borderBottomLeftRadius: 4,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: { fontSize: 16, color: bubble.text, lineHeight: 22 },
  time: { fontSize: 11, color: bubble.sub, marginTop: 6, alignSelf: "flex-end" },
  emptyWrap: { paddingVertical: 48, paddingHorizontal: 20, alignItems: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#374151" },
  emptySub: { marginTop: 8, fontSize: 14, color: bubble.sub, textAlign: "center", lineHeight: 21 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e8e0f0",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  sendBtn: {
    backgroundColor: bubble.accent,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnOff: { opacity: 0.45 },
  sendBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
})
