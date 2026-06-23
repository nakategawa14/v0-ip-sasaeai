import FontAwesome from "@expo/vector-icons/FontAwesome"
import { useFocusEffect } from "@react-navigation/native"
import { type Href, Stack, useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  type AlertButton,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { StackBackButton } from "@/components/navigation/StackBackButton"
import { useAuth } from "@/contexts/AuthContext"
import { saveBlockToBlocksTable } from "@/lib/blocks/saveBlockToBlocksTable"
import {
  hasBlockFromViewerToPeer,
  insertBlockAdminNotification,
  maybeFlagBlockedUserAfterBlock,
  removeUserBlock,
} from "@/lib/blocks/userBlockActions"
import { TABLES } from "@/lib/constants/tables"
import { saveReportToReportsTable } from "@/lib/reports/saveReportToReportsTable"
import { isMatchedRow, peerIdFromMatch } from "@/lib/matching/peer"
import {
  calculateAge,
  genderLabel,
  getProfileImageUrl,
  getSubImageUrls,
  parseProfileTags,
  type SasaeaiProfileRow,
} from "@/lib/profile/display"
import { fetchMatchesParticipatedByUser } from "@/lib/supabase/fetch-matches-for-user"
import { supabase } from "@/lib/supabase"
import { brandScreen } from "@/lib/theme/brandScreen"

type MatchRow = { id: string; user1_id: string; user2_id: string; status?: string | null }

type SendLikeResult = {
  ok?: boolean
  celebrate?: boolean
  already_liked?: boolean
  reciprocal?: boolean
  error?: string
}

/** Web / scripts/08_create_moderation_tables.sql の CHECK と揃える */
type ReportTypeDb = "inappropriate" | "spam" | "harassment" | "other"

const REPORT_TYPE_OPTIONS: { value: ReportTypeDb; label: string }[] = [
  { value: "inappropriate", label: "不適切なコンテンツ" },
  { value: "spam", label: "スパム" },
  { value: "harassment", label: "嫌がらせ" },
  { value: "other", label: "その他" },
]

const REPORT_DETAIL_MIN = 10

/**
 * Web / WebView では `Alert.alert` が動かないため `window.confirm` / `window.alert` にフォールバックする。
 * 2 ボタンは [キャンセル系, 確定系] を想定し、confirm の OK で後者の `onPress` を呼ぶ。
 */
function webCompatibleAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons)
    return
  }
  if (typeof window === "undefined") return

  const hasTitle = title.trim().length > 0
  const hasMsg = Boolean(message && message.trim().length > 0)
  const combined =
    hasTitle && hasMsg ? `${title}\n\n${message}` : hasTitle ? title : hasMsg ? String(message).trim() : title

  if (!buttons || buttons.length === 0) {
    window.alert(combined)
    return
  }

  if (buttons.length === 1) {
    window.alert(combined)
    const fn = buttons[0].onPress
    if (typeof fn === "function") (fn as () => void)()
    return
  }

  if (buttons.length === 2) {
    const [first, second] = buttons
    const okMeansSecond = first.style === "cancel"
    if (window.confirm(combined)) {
      const fn = (okMeansSecond ? second : first).onPress
      if (typeof fn === "function") (fn as () => void)()
    } else {
      const fn = (okMeansSecond ? first : second).onPress
      if (typeof fn === "function") (fn as () => void)()
    }
    return
  }

  window.alert(`${combined}\n\n（この環境では OK のみ表示します）`)
  const last = buttons[buttons.length - 1]
  const fn = last?.onPress
  if (typeof fn === "function") (fn as () => void)()
}

export default function PublicProfilePreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<SasaeaiProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [liked, setLiked] = useState(false)
  const [matched, setMatched] = useState(false)
  const [likeBusy, setLikeBusy] = useState(false)
  const [showMatchCelebration, setShowMatchCelebration] = useState(false)

  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState<ReportTypeDb>("inappropriate")
  const [reportDetail, setReportDetail] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)

  const [iBlockedThem, setIBlockedThem] = useState(false)
  const [blockBusy, setBlockBusy] = useState(false)

  const loadProfile = useCallback(async () => {
    if (!id || typeof id !== "string") {
      setError("ユーザーが指定されていません")
      setLoading(false)
      return
    }
    const { data, error: q } = await supabase
      .from(TABLES.PROFILES)
      .select(
        "id,nickname,birth_date,gender,prefecture,city,bio,user_type,is_verified,is_active,is_secret_mode,profile_images,profile_image_url,tags,purpose,preferred_gender,height,hometown,favorite_areas,favorite_city,supporter_message,verification_status,employment_status,employment_type,occupation,annual_income,living_situation,family_relationship,can_go_out_alone,independence_level,updated_at",
      )
      .eq("id", id)
      .maybeSingle()
    if (q) {
      setError(q.message)
      setProfile(null)
    } else if (!data || data.is_active === false) {
      setError("このプロフィールは表示できません")
      setProfile(null)
    } else {
      const row = data as SasaeaiProfileRow
      const viewerId = user?.id
      const secret = row.is_secret_mode === true
      if (secret) {
        if (!viewerId) {
          setError("このプロフィールは表示できません")
          setProfile(null)
        } else if (viewerId === row.id) {
          setProfile(row)
          setError(null)
        } else {
          const { data: reveal } = await supabase
            .from(TABLES.LIKES)
            .select("id")
            .eq("from_user_id", row.id)
            .eq("to_user_id", viewerId)
            .maybeSingle()
          if (!reveal) {
            setError("このプロフィールは表示できません")
            setProfile(null)
          } else {
            setProfile(row)
            setError(null)
          }
        }
      } else {
        setProfile(row)
        setError(null)
      }
    }
    setLoading(false)
  }, [id, user?.id])

  const refreshLikeAndMatch = useCallback(async () => {
    if (!user?.id || !id || typeof id !== "string" || !profile?.id || profile.id === user.id) {
      setLiked(false)
      setMatched(false)
      return
    }
    const [likeRes, matchRes] = await Promise.all([
      supabase.from(TABLES.LIKES).select("id").eq("from_user_id", user.id).eq("to_user_id", profile.id).maybeSingle(),
      fetchMatchesParticipatedByUser(supabase, user.id, "id, user1_id, user2_id, status"),
    ])
    if (matchRes.error) {
      setLiked(!!likeRes.data)
      setMatched(false)
      return
    }
    const likeRow = likeRes.data
    const matchRows = matchRes.data
    setLiked(!!likeRow)
    const pair = ((matchRows ?? []) as MatchRow[]).find((m) => peerIdFromMatch(m, user.id) === profile.id)
    setMatched(!!pair && isMatchedRow(pair.status))
  }, [user?.id, id, profile?.id])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (profile?.id && user?.id) void refreshLikeAndMatch()
  }, [profile?.id, user?.id, refreshLikeAndMatch])

  useEffect(() => {
    if (!user?.id || !profile?.id || profile.id === user.id) {
      setIBlockedThem(false)
      return
    }
    let cancelled = false
    void (async () => {
      const v = await hasBlockFromViewerToPeer(supabase, user.id, profile.id)
      if (!cancelled) setIBlockedThem(v)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, profile?.id])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      void loadProfile()
      if (profile?.id && user?.id) void refreshLikeAndMatch()
    }, [loadProfile, profile?.id, user?.id, refreshLikeAndMatch]),
  )

  const onPressLike = async () => {
    if (!user?.id || !profile?.id || profile.id === user.id || likeBusy || liked) return
    setLikeBusy(true)
    const { data, error: rpcErr } = await supabase.rpc("sasaeai_send_like", { p_peer_id: profile.id })
    setLikeBusy(false)

    if (rpcErr) {
      if (rpcErr.message?.includes("function") && rpcErr.message?.includes("does not exist")) {
        webCompatibleAlert(
          "サーバー設定が必要です",
          "いいねの送受信に必要な設定が完了していません。しばらくしてから再度お試しいただくか、サポートへお問い合わせください。",
        )
      } else {
        webCompatibleAlert("いいねを送れませんでした", rpcErr.message)
      }
      return
    }

    const res = (data ?? {}) as SendLikeResult
    if (res.ok === false) {
      webCompatibleAlert("いいねを送れませんでした", res.error ?? "不明なエラー")
      return
    }

    await refreshLikeAndMatch()

    if (res.celebrate) {
      setShowMatchCelebration(true)
    }
  }

  const goChat = () => {
    if (!profile?.id) return
    setShowMatchCelebration(false)
    router.push({ pathname: "/(tabs)/chat/[id]", params: { id: profile.id } } as Href)
  }

  const openReportFlow = () => {
    if (!user?.id || !profile?.id || profile.id === user.id) return
    webCompatibleAlert(
      "通報の確認",
      "虚偽・いたずらの通報はお控えください。問題のある場合のみ、通報フォームへ進んでください。",
      [
        { text: "キャンセル", style: "cancel" },
        { text: "通報フォームを開く", style: "destructive", onPress: () => setShowReportModal(true) },
      ],
    )
  }

  const runBlockSideEffects = useCallback(async (blockerId: string, blockedId: string) => {
    await insertBlockAdminNotification(supabase, blockerId, blockedId)
    await maybeFlagBlockedUserAfterBlock(supabase, blockedId)
  }, [])

  const performBlockCore = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !profile?.id) return false
    setBlockBusy(true)
    const { error } = await saveBlockToBlocksTable(supabase, user.id, profile.id)
    if (error) {
      setBlockBusy(false)
      webCompatibleAlert("ブロックできませんでした", error)
      return false
    }
    await runBlockSideEffects(user.id, profile.id)
    setIBlockedThem(true)
    setBlockBusy(false)
    return true
  }, [user?.id, profile?.id, runBlockSideEffects])

  const finishBlockSuccessWithBack = useCallback(() => {
    webCompatibleAlert("ブロックしました", "", [{ text: "OK", onPress: () => router.back() }])
  }, [router])

  const confirmBlockUser = () => {
    if (!user?.id || !profile?.id || profile.id === user.id || blockBusy) return
    webCompatibleAlert(
      "このユーザーをブロックしますか？",
      "ブロックするとお互いにメッセージの送受信ができなくなり、一覧にも表示されなくなります。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "ブロックする",
          style: "destructive",
          onPress: () =>
            void (async () => {
              const ok = await performBlockCore()
              if (ok) finishBlockSuccessWithBack()
            })(),
        },
      ],
    )
  }

  const confirmUnblockUser = () => {
    if (!user?.id || !profile?.id || blockBusy) return
    webCompatibleAlert("ブロック解除", "このユーザーのブロックを解除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "解除する",
        onPress: () =>
          void (async () => {
            setBlockBusy(true)
            const { error } = await removeUserBlock(supabase, user.id!, profile!.id)
            setBlockBusy(false)
            if (error) {
              webCompatibleAlert("解除できませんでした", error)
              return
            }
            setIBlockedThem(false)
            webCompatibleAlert("", "ブロックを解除しました。")
          })(),
      },
    ])
  }

  const offerBlockAfterReport = () => {
    if (!user?.id || !profile?.id || profile.id === user.id) return
    webCompatibleAlert(
      "ブロックの確認",
      "あわせてこのユーザーをブロックして、一切の接触を断ちますか？",
      [
        { text: "いいえ", style: "cancel" },
        {
          text: "ブロックする",
          style: "destructive",
          onPress: () =>
            void (async () => {
              const ok = await performBlockCore()
              if (ok) finishBlockSuccessWithBack()
            })(),
        },
      ],
    )
  }

  const closeReportModal = () => {
    setShowReportModal(false)
    setReportDetail("")
    setReportType("inappropriate")
    setReportSubmitting(false)
  }

  const submitReport = async () => {
    if (!user?.id || !profile?.id || profile.id === user.id) return
    const detail = reportDetail.trim()
    if (detail.length < REPORT_DETAIL_MIN) {
      webCompatibleAlert("入力不足", `詳細は${REPORT_DETAIL_MIN}文字以上で入力してください。`)
      return
    }
    setReportSubmitting(true)
    const { error: insErr } = await saveReportToReportsTable(supabase, user.id, profile.id, {
      report_type: reportType,
      reason: detail,
      report_reason: detail,
      context_type: "profile",
      context_id: null,
    })
    setReportSubmitting(false)
    if (insErr) {
      webCompatibleAlert("送信できませんでした", insErr)
      return
    }
    closeReportModal()
    webCompatibleAlert("通報を受理しました", "ご報告ありがとうございます。運営にて確認いたします。", [
      {
        text: "OK",
        onPress: () => {
          offerBlockAfterReport()
        },
      },
    ])
  }

  const screenHeaderOptions = useMemo(() => {
    const headerLeft = () => <StackBackButton fallbackHref="/(tabs)" />
    const title = !loading && !error && profile?.nickname ? profile.nickname : "プロフィール"
    return { title, headerLeft }
  }, [loading, error, profile?.nickname])

  if (loading) {
    return (
      <SafeAreaView style={brandScreen.pageTint} edges={["bottom"]}>
        <Stack.Screen options={screenHeaderOptions} />
        <View style={styles.center}>
          <ActivityIndicator color="#db2777" />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !profile?.nickname) {
    return (
      <SafeAreaView style={brandScreen.pageTint} edges={["bottom"]}>
        <Stack.Screen options={screenHeaderOptions} />
        <View style={styles.center}>
          <Text style={styles.err}>{error ?? "プロフィールが見つかりません"}</Text>
          <Text style={styles.errHint}>画面上部の「戻る」で一覧へ戻れます。</Text>
        </View>
      </SafeAreaView>
    )
  }

  const img = getProfileImageUrl(profile)
  const subImages = getSubImageUrls(profile)
  const age = profile.birth_date && typeof profile.birth_date === "string" ? calculateAge(profile.birth_date) : undefined
  const tags = parseProfileTags(profile)
  const isSelf = user?.id === profile.id

  return (
    <SafeAreaView style={brandScreen.pageTint} edges={["bottom"]}>
      <Stack.Screen options={screenHeaderOptions} />
      <View style={brandScreen.gradientBg} pointerEvents="none" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[brandScreen.card, styles.hero]}>
          {img ? (
            <Image source={{ uri: img }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPh]}>
              <Text style={styles.init}>{profile.nickname.slice(0, 2)}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile.nickname}</Text>
          <Text style={styles.line}>
            {[age != null ? `${age}歳` : null, profile.gender ? genderLabel(String(profile.gender)) : null]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <Text style={styles.line}>
            {profile.prefecture ? `${profile.prefecture}${profile.city ? ` ${String(profile.city)}` : ""}` : ""}
          </Text>
        </View>

        {user?.id && !isSelf ? (
          <View style={styles.likeSection}>
            <Pressable
              style={[styles.likeBtn, (liked || likeBusy) && styles.likeBtnDone]}
              onPress={() => void onPressLike()}
              disabled={liked || likeBusy}
              accessibilityRole="button"
              accessibilityLabel={liked ? "いいね済み" : "いいね"}
            >
              {likeBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <FontAwesome name="heart" size={22} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.likeBtnText}>{liked ? "いいね！済み" : "いいね！"}</Text>
                </>
              )}
            </Pressable>
            <Text style={styles.likeHint}>
              {liked
                ? "あなたからのいいねは送信済みです。相手からもいいねがあるとマッチ成立です。"
                : "気になる相手にハートを送りましょう。相互いいねでマッチが成立します。"}
            </Text>
          </View>
        ) : null}

        {subImages.length > 0 ? (
          <View style={[brandScreen.card, styles.block]}>
            <Text style={brandScreen.sectionTitle}>その他の写真</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subImgRow}>
              {subImages.map((uri, i) => (
                <Image key={uri + i} source={{ uri }} style={styles.subImage} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {tags.length > 0 ? (
          <View style={[brandScreen.card, styles.block]}>
            <Text style={brandScreen.sectionTitle}>タグ</Text>
            <View style={styles.tags}>
              {tags.map((t, i) => (
                <View key={`${t}-${i}`} style={styles.tag}>
                  <Text style={styles.tagT}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {profile.bio ? (
          <View style={[brandScreen.card, styles.block]}>
            <Text style={brandScreen.sectionTitle}>自己紹介</Text>
            <Text style={styles.bio}>{String(profile.bio)}</Text>
          </View>
        ) : null}

        <View style={styles.future}>
          <FontAwesome name="info-circle" size={18} color="#2563eb" />
          <Text style={styles.futureText}>
            マッチが成立（相互いいね）するとメッセージのやり取りができます。まずは「いいね！」から始めましょう。
          </Text>
        </View>

        {user?.id && !isSelf ? (
          matched ? (
            <Pressable
              style={[brandScreen.primaryBtn, styles.chatBtn]}
              onPress={() => router.push({ pathname: "/(tabs)/chat/[id]", params: { id: profile.id } } as Href)}
              accessibilityRole="button"
              accessibilityLabel="メッセージを送る"
            >
              <FontAwesome name="comments" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={brandScreen.primaryBtnText}>メッセージを送る</Text>
            </Pressable>
          ) : (
            <View style={styles.chatLocked}>
              <FontAwesome name="lock" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
              <Text style={styles.chatLockedText}>マッチ成立後に「メッセージを送る」が使えるようになります</Text>
            </View>
          )
        ) : null}

        {user?.id && !isSelf ? (
          <View style={styles.safetyActions}>
            <Pressable
              style={[styles.blockMainBtn, blockBusy && styles.blockMainBtnDisabled]}
              onPress={() => (iBlockedThem ? confirmUnblockUser() : confirmBlockUser())}
              disabled={blockBusy}
              accessibilityRole="button"
              accessibilityLabel={iBlockedThem ? "ブロックを解除する" : "このユーザーをブロックする"}
            >
              {blockBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <FontAwesome name="ban" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.blockMainBtnText}>
                    {iBlockedThem ? "ブロックを解除する" : "このユーザーをブロックする"}
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={styles.reportFootnote}
              onPress={openReportFlow}
              accessibilityRole="button"
              accessibilityLabel="このユーザーを通報する"
            >
              <FontAwesome name="flag-o" size={14} color="#9ca3af" style={{ marginRight: 6 }} />
              <Text style={styles.reportFootnoteText}>このユーザーを通報する</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showMatchCelebration} transparent animationType="fade" onRequestClose={() => setShowMatchCelebration(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMatchCelebration(false)}>
          <Pressable style={styles.celebrateCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.celebrateSpark}>✨</Text>
            <View style={styles.celebrateHearts}>
              <FontAwesome name="heart" size={36} color="#f472b6" />
              <FontAwesome name="heart" size={48} color="#db2777" style={{ marginHorizontal: 8 }} />
              <FontAwesome name="heart" size={36} color="#60a5fa" />
            </View>
            <Text style={styles.celebrateTitle}>マッチング成立！</Text>
            <Text style={styles.celebrateSub}>おめでとうございます。さっそくメッセージを送ってみましょう。</Text>
            <Pressable style={[brandScreen.primaryBtn, styles.celebratePrimary]} onPress={goChat}>
              <Text style={brandScreen.primaryBtnText}>メッセージを送る</Text>
            </Pressable>
            <Pressable style={styles.celebrateSecondary} onPress={() => setShowMatchCelebration(false)}>
              <Text style={styles.celebrateSecondaryTxt}>あとで</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showReportModal} animationType="slide" transparent onRequestClose={closeReportModal}>
        <KeyboardAvoidingView
          style={styles.reportModalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 48 : 0}
        >
          <Pressable style={styles.reportModalBackdrop} onPress={closeReportModal} />
          <View style={styles.reportSheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.reportSheetTitle}>ユーザーを通報</Text>
              <Text style={styles.reportSheetHint}>通報内容は運営のみが確認します。内容に応じて対応いたします。</Text>

              <Text style={styles.reportSectionLabel}>通報理由</Text>
              {REPORT_TYPE_OPTIONS.map((opt) => {
                const on = reportType === opt.value
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.reportRadioRow, on && styles.reportRadioRowOn]}
                    onPress={() => setReportType(opt.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                  >
                    <View style={[styles.reportRadioDot, on && styles.reportRadioDotOn]} />
                    <Text style={[styles.reportRadioLabel, on && styles.reportRadioLabelOn]}>{opt.label}</Text>
                  </Pressable>
                )
              })}

              <Text style={styles.reportSectionLabel}>詳細（{REPORT_DETAIL_MIN}文字以上）</Text>
              <TextInput
                style={styles.reportTextArea}
                value={reportDetail}
                onChangeText={setReportDetail}
                placeholder="具体的な状況を記入してください"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                maxLength={2000}
              />
              <Text style={styles.reportCharCount}>
                {reportDetail.trim().length} / {REPORT_DETAIL_MIN}文字以上
              </Text>
            </ScrollView>

            <View style={styles.reportActions}>
              <Pressable style={styles.reportBtnSecondary} onPress={closeReportModal} disabled={reportSubmitting}>
                <Text style={styles.reportBtnSecondaryText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={[styles.reportBtnPrimary, reportSubmitting && styles.reportBtnPrimaryDisabled]}
                onPress={() => void submitReport()}
                disabled={reportSubmitting}
              >
                {reportSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.reportBtnPrimaryText}>送信する</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  err: { color: "#991b1b", marginBottom: 12, textAlign: "center", paddingHorizontal: 16 },
  errHint: { fontSize: 13, color: "#6b7280", textAlign: "center", paddingHorizontal: 20 },
  scroll: { padding: 16, paddingBottom: 32 },
  hero: { alignItems: "center" },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    backgroundColor: "#f3f4f6",
  },
  avatarPh: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fce7f3",
  },
  init: { fontSize: 36, fontWeight: "900", color: "#db2777" },
  name: { fontSize: 22, fontWeight: "900", color: "#111827" },
  line: { fontSize: 14, color: "#6b7280", marginTop: 4, textAlign: "center" },
  likeSection: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#db2777",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fce7f3",
    shadowColor: "#db2777",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  likeBtnDone: {
    backgroundColor: "#9d174d",
    borderColor: "#fbcfe8",
    shadowOpacity: 0.15,
  },
  likeBtnText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  likeHint: { marginTop: 10, fontSize: 13, color: "#6b7280", lineHeight: 20, textAlign: "center", paddingHorizontal: 8 },
  block: { marginTop: 14 },
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
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: "#fce7f3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f9a8d4",
  },
  tagT: { fontSize: 12, color: "#9d174d", fontWeight: "600" },
  bio: { fontSize: 15, color: "#4b5563", lineHeight: 24 },
  future: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    padding: 14,
    marginTop: 16,
  },
  futureText: { flex: 1, fontSize: 13, color: "#1e40af", lineHeight: 20 },
  chatBtn: {
    marginTop: 16,
    alignSelf: "stretch",
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chatLocked: {
    marginTop: 16,
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chatLockedText: { flex: 1, fontSize: 13, color: "#6b7280", lineHeight: 19 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  celebrateCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    backgroundColor: "#fff",
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#f9a8d4",
    shadowColor: "#db2777",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  celebrateSpark: { fontSize: 28, marginBottom: 4 },
  celebrateHearts: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  celebrateTitle: { fontSize: 24, fontWeight: "900", color: "#db2777", textAlign: "center" },
  celebrateSub: {
    marginTop: 10,
    fontSize: 15,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  celebratePrimary: { alignSelf: "stretch", minWidth: 200 },
  celebrateSecondary: { marginTop: 14, paddingVertical: 8 },
  celebrateSecondaryTxt: { fontSize: 15, color: "#6b7280", fontWeight: "600" },
  safetyActions: {
    marginTop: 24,
    marginBottom: 8,
    gap: 12,
    alignSelf: "stretch",
    paddingHorizontal: 4,
  },
  blockMainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#374151",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  blockMainBtnDisabled: { opacity: 0.65 },
  blockMainBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  reportFootnote: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  reportFootnoteText: {
    fontSize: 13,
    color: "#9ca3af",
    textDecorationLine: "underline",
  },
  reportModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17,24,39,0.45)",
  },
  reportModalBackdrop: {
    flex: 1,
  },
  reportSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    maxHeight: "88%",
  },
  reportSheetTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 8 },
  reportSheetHint: { fontSize: 13, color: "#6b7280", lineHeight: 19, marginBottom: 16 },
  reportSectionLabel: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8, marginTop: 4 },
  reportRadioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  reportRadioRowOn: {
    borderColor: "#f9a8d4",
    backgroundColor: "#fdf2f8",
  },
  reportRadioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginRight: 10,
  },
  reportRadioDotOn: {
    borderColor: "#db2777",
    backgroundColor: "#db2777",
  },
  reportRadioLabel: { fontSize: 15, color: "#4b5563", flex: 1 },
  reportRadioLabelOn: { color: "#831843", fontWeight: "600" },
  reportTextArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#fafafa",
  },
  reportCharCount: { fontSize: 12, color: "#9ca3af", marginTop: 6 },
  reportActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  reportBtnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  reportBtnSecondaryText: { fontSize: 15, fontWeight: "600", color: "#6b7280" },
  reportBtnPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#db2777",
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  reportBtnPrimaryDisabled: { opacity: 0.65 },
  reportBtnPrimaryText: { fontSize: 15, fontWeight: "800", color: "#fff" },
})
