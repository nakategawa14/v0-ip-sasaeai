import FontAwesome from "@expo/vector-icons/FontAwesome"
import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { useAuth } from "@/contexts/AuthContext"
import {
  EMPLOYMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  LIVING_OPTIONS,
  PREFECTURES,
  PURPOSE_OPTIONS,
  TAG_POOL,
  USER_TYPES,
} from "@/lib/constants/profile-mobile"
import { TABLES } from "@/lib/constants/tables"
import { isLikelyImageFetchUrl } from "@/lib/profile/display"
import { uploadProfileSlotFromUri } from "@/lib/profile/uploadProfileImage"
import { supabase } from "@/lib/supabase"
import { brandScreen } from "@/lib/theme/brandScreen"

function parseStringArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter((x): x is string => typeof x === "string")
  if (typeof val === "string") {
    try {
      const j = JSON.parse(val) as unknown
      if (Array.isArray(j)) return j.filter((x): x is string => typeof x === "string")
    } catch {
      return []
    }
  }
  return []
}

function ChipRow({
  options,
  value,
  onChange,
  multi,
}: {
  options: { value: string; label: string }[]
  value: string | string[]
  onChange: (v: string | string[]) => void
  multi?: boolean
}) {
  const selected = multi ? (Array.isArray(value) ? value : []) : null
  return (
    <View style={styles.chipWrap}>
      {options.map((opt) => {
        const active = multi ? selected!.includes(opt.value) : value === opt.value
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => {
              if (multi) {
                const cur = selected!
                onChange(cur.includes(opt.value) ? cur.filter((x) => x !== opt.value) : [...cur, opt.value])
              } else {
                onChange(opt.value)
              }
            }}
            style={[styles.chip, active && styles.chipOn]}
          >
            <Text style={[styles.chipTxt, active && styles.chipTxtOn]}>{opt.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default function ProfileEditScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nickname, setNickname] = useState("")
  const [bio, setBio] = useState("")
  const [gender, setGender] = useState<string>("")
  const [birthDate, setBirthDate] = useState("")
  const [prefecture, setPrefecture] = useState("")
  const [city, setCity] = useState("")
  const [userType, setUserType] = useState<string>("")
  const [height, setHeight] = useState("")
  const [hometown, setHometown] = useState("")
  const [favoriteCity, setFavoriteCity] = useState("")
  const [purpose, setPurpose] = useState<string[]>([])
  const [preferredGender, setPreferredGender] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [livingSituation, setLivingSituation] = useState<string>("")
  const [employmentType, setEmploymentType] = useState<string>("")
  const [supporterMessage, setSupporterMessage] = useState("")

  /** DB に保存済みの公開 URL（空文字は「未設定」） */
  const [remoteImage1, setRemoteImage1] = useState("")
  const [remoteImage2, setRemoteImage2] = useState("")
  const [remoteImage3, setRemoteImage3] = useState("")
  /** ライブラリで選んだ未アップロードのローカル URI */
  const [pendingUri1, setPendingUri1] = useState<string | null>(null)
  const [pendingUri2, setPendingUri2] = useState<string | null>(null)
  const [pendingUri3, setPendingUri3] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    const { data, error: q } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).maybeSingle()
    if (q || !data) {
      setError(q?.message ?? "プロフィールを読み込めませんでした")
      setLoading(false)
      return
    }
    setNickname(String(data.nickname ?? ""))
    setBio(String(data.bio ?? ""))
    setGender(String(data.gender ?? ""))
    setBirthDate(String(data.birth_date ?? "").slice(0, 10))
    setPrefecture(String(data.prefecture ?? ""))
    setCity(String(data.city ?? ""))
    setUserType(String(data.user_type ?? ""))
    setHeight(data.height != null ? String(data.height) : "")
    setHometown(String(data.hometown ?? ""))
    setFavoriteCity(String(data.favorite_city ?? ""))
    setPurpose(parseStringArray(data.purpose))
    setPreferredGender(parseStringArray(data.preferred_gender))
    setTags(parseStringArray(data.tags))
    setLivingSituation(String(data.living_situation ?? ""))
    setEmploymentType(String(data.employment_type ?? ""))
    setSupporterMessage(String(data.supporter_message ?? ""))
    const s1 = typeof data.profile_image_1 === "string" ? data.profile_image_1.trim() : ""
    const s2 = typeof data.profile_image_2 === "string" ? data.profile_image_2.trim() : ""
    const s3 = typeof data.profile_image_3 === "string" ? data.profile_image_3.trim() : ""
    setRemoteImage1(s1)
    setRemoteImage2(s2)
    setRemoteImage3(s3)
    setPendingUri1(null)
    setPendingUri2(null)
    setPendingUri3(null)
    setError(null)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const pickFromLibrary = useCallback(async (slot: 1 | 2 | 3) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert("許可が必要です", "フォトライブラリへのアクセスを許可してください。")
      return
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: slot === 1,
      aspect: slot === 1 ? [1, 1] : undefined,
      quality: 0.9,
    })
    if (picked.canceled || !picked.assets[0]?.uri) return
    const uri = picked.assets[0].uri
    if (slot === 1) setPendingUri1(uri)
    if (slot === 2) setPendingUri2(uri)
    if (slot === 3) setPendingUri3(uri)
  }, [])

  const clearSlot = (slot: 1 | 2 | 3) => {
    if (slot === 1) {
      setPendingUri1(null)
      setRemoteImage1("")
    }
    if (slot === 2) {
      setPendingUri2(null)
      setRemoteImage2("")
    }
    if (slot === 3) {
      setPendingUri3(null)
      setRemoteImage3("")
    }
  }

  const previewUri = (slot: 1 | 2 | 3) => {
    const pending = slot === 1 ? pendingUri1 : slot === 2 ? pendingUri2 : pendingUri3
    if (pending) return pending
    const remote = slot === 1 ? remoteImage1 : slot === 2 ? remoteImage2 : remoteImage3
    if (remote && isLikelyImageFetchUrl(remote)) return remote
    return null
  }

  const save = async () => {
    if (!user?.id || !user.email) {
      Alert.alert("エラー", "ログイン情報がありません")
      return
    }
    if (!nickname.trim() || !gender || !birthDate || !prefecture || !userType) {
      setError("ニックネーム・性別・生年月日・都道府県・ユーザー種別は必須です")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { data: existing, error: exErr } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()
      if (exErr || !existing) {
        setError(exErr?.message ?? "既存プロフィールの取得に失敗しました")
        return
      }

      let url1: string | null = remoteImage1.trim() || null
      let url2: string | null = remoteImage2.trim() || null
      let url3: string | null = remoteImage3.trim() || null

      if (pendingUri1) url1 = await uploadProfileSlotFromUri(user.id, 1, pendingUri1)
      if (pendingUri2) url2 = await uploadProfileSlotFromUri(user.id, 2, pendingUri2)
      if (pendingUri3) url3 = await uploadProfileSlotFromUri(user.id, 3, pendingUri3)

      const ordered = [url1, url2, url3].filter((u): u is string => Boolean(u && u.trim()))
      const h = height.trim() ? Number.parseInt(height.trim(), 10) : null
      const heightVal = h != null && !Number.isNaN(h) ? h : null

      const payload: Record<string, unknown> = {
        ...existing,
        id: user.id,
        email: user.email,
        nickname: nickname.trim(),
        bio: bio.trim() || null,
        gender,
        birth_date: birthDate,
        prefecture,
        city: city.trim() || null,
        user_type: userType,
        height: heightVal,
        hometown: hometown.trim() || null,
        favorite_city: favoriteCity.trim() || null,
        purpose,
        preferred_gender: preferredGender,
        tags,
        living_situation: livingSituation || null,
        employment_type: employmentType || null,
        supporter_message: userType === "supporter" ? supporterMessage.trim() || null : existing.supporter_message,
        is_active: existing.is_active ?? true,
        profile_image_1: url1,
        profile_image_2: url2,
        profile_image_3: url3,
        profile_images: ordered.length ? ordered : null,
        profile_image_url: url1,
      }

      const { error: upErr } = await supabase.from(TABLES.PROFILES).upsert(payload, { onConflict: "id" })
      if (upErr) {
        setError(upErr.message)
        return
      }

      setRemoteImage1(url1 ?? "")
      setRemoteImage2(url2 ?? "")
      setRemoteImage3(url3 ?? "")
      setPendingUri1(null)
      setPendingUri2(null)
      setPendingUri3(null)

      router.back()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={brandScreen.pageTint} edges={["bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator color="#db2777" size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={brandScreen.pageTint} edges={["bottom"]}>
      <View style={brandScreen.gradientBg} pointerEvents="none" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.head}>
            <FontAwesome name="heart" size={22} color="#ec4899" />
            <Text style={styles.headTitle}>プロフィールを編集</Text>
            <Text style={styles.headSub}>
              基本情報に加え、メイン・サブ写真（最大3枚）をライブラリから選べます。保存時に Supabase Storage へアップロードし、URL を sasaeai_profiles に書き込みます。
            </Text>
          </View>

          <View style={brandScreen.card}>
            <Text style={brandScreen.sectionTitle}>プロフィール写真</Text>
            <Text style={styles.photoHint}>
              メインは 1 枚目（さがす一覧のカードに表示）。サブは 2・3 枚目。バケット「profile-images」が未作成の場合は Supabase コンソールで作成し、認証ユーザーの upload と公開 read を有効にしてください（または .env の
              EXPO_PUBLIC_SUPABASE_PROFILE_BUCKET）。
            </Text>

            {([1, 2, 3] as const).map((slot) => {
              const labels = ["メイン（1枚目）", "サブ（2枚目）", "サブ（3枚目）"]
              const uri = previewUri(slot)
              return (
                <View key={slot} style={styles.photoBlock}>
                  <Text style={styles.lbl}>{labels[slot - 1]}</Text>
                  <View style={styles.photoPreviewWrap}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.photoPreview} resizeMode="cover" />
                    ) : (
                      <View style={[styles.photoPreview, styles.photoPlaceholder]}>
                        <FontAwesome name="image" size={32} color="#d1d5db" />
                      </View>
                    )}
                  </View>
                  <View style={styles.photoActions}>
                    <Pressable style={styles.photoBtn} onPress={() => void pickFromLibrary(slot)}>
                      <FontAwesome name="photo" size={14} color="#fff" />
                      <Text style={styles.photoBtnTxt}>ライブラリから選択</Text>
                    </Pressable>
                    <Pressable style={styles.photoBtnOutline} onPress={() => clearSlot(slot)}>
                      <Text style={styles.photoBtnOutlineTxt}>削除</Text>
                    </Pressable>
                  </View>
                </View>
              )
            })}
          </View>

          {error ? (
            <View style={styles.errBox}>
              <Text style={styles.errTxt}>{error}</Text>
            </View>
          ) : null}

          <View style={brandScreen.card}>
            <Text style={brandScreen.sectionTitle}>基本</Text>
            <Text style={styles.lbl}>ニックネーム *</Text>
            <TextInput style={styles.inp} value={nickname} onChangeText={setNickname} placeholder="例: はっしー" />

            <Text style={styles.lbl}>自己紹介</Text>
            <TextInput
              style={[styles.inp, styles.area]}
              value={bio}
              onChangeText={setBio}
              placeholder="あなたのことを教えてください"
              multiline
            />

            <Text style={styles.lbl}>性別 *</Text>
            <ChipRow options={[...GENDER_OPTIONS]} value={gender} onChange={(v) => setGender(v as string)} />

            <Text style={styles.lbl}>生年月日 *（YYYY-MM-DD）</Text>
            <TextInput style={styles.inp} value={birthDate} onChangeText={setBirthDate} placeholder="1990-01-01" />

            <Text style={styles.lbl}>都道府県 *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prefRow}>
              {PREFECTURES.map((p) => (
                <Pressable key={p} onPress={() => setPrefecture(p)} style={[styles.prefChip, prefecture === p && styles.prefChipOn]}>
                  <Text style={[styles.prefChipTxt, prefecture === p && styles.prefChipTxtOn]}>{p}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.lbl}>市区町村</Text>
            <TextInput style={styles.inp} value={city} onChangeText={setCity} placeholder="例: 渋谷区" />

            <Text style={styles.lbl}>ユーザー種別 *</Text>
            <ChipRow options={[...USER_TYPES]} value={userType} onChange={(v) => setUserType(v as string)} />
          </View>

          <View style={brandScreen.card}>
            <Text style={brandScreen.sectionTitle}>目的・希望</Text>
            <Text style={styles.lbl}>活動目的（複数可）</Text>
            <ChipRow options={[...PURPOSE_OPTIONS]} value={purpose} onChange={(v) => setPurpose(v as string[])} multi />

            <Text style={styles.lbl}>希望する相手の性別（複数可）</Text>
            <ChipRow options={[...GENDER_OPTIONS]} value={preferredGender} onChange={(v) => setPreferredGender(v as string[])} multi />
          </View>

          <View style={brandScreen.card}>
            <Text style={brandScreen.sectionTitle}>プロフィールタグ（複数可）</Text>
            <View style={styles.chipWrap}>
              {TAG_POOL.map((t) => (
                <Pressable key={t} onPress={() => toggleTag(t)} style={[styles.chip, tags.includes(t) && styles.chipOn]}>
                  <Text style={[styles.chipTxt, tags.includes(t) && styles.chipTxtOn]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={brandScreen.card}>
            <Text style={brandScreen.sectionTitle}>詳細</Text>
            <Text style={styles.lbl}>身長（cm）</Text>
            <TextInput style={styles.inp} value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="170" />

            <Text style={styles.lbl}>出身地</Text>
            <TextInput style={styles.inp} value={hometown} onChangeText={setHometown} />

            <Text style={styles.lbl}>好きな街</Text>
            <TextInput style={styles.inp} value={favoriteCity} onChangeText={setFavoriteCity} />

            <Text style={styles.lbl}>住まい</Text>
            <ChipRow options={[...LIVING_OPTIONS]} value={livingSituation} onChange={(v) => setLivingSituation(v as string)} />

            <Text style={styles.lbl}>就労形態</Text>
            <ChipRow options={[...EMPLOYMENT_TYPE_OPTIONS]} value={employmentType} onChange={(v) => setEmploymentType(v as string)} />
          </View>

          {userType === "supporter" ? (
            <View style={brandScreen.card}>
              <Text style={brandScreen.sectionTitle}>サポーターメッセージ</Text>
              <TextInput
                style={[styles.inp, styles.area]}
                value={supporterMessage}
                onChangeText={setSupporterMessage}
                placeholder="支援の想いなど"
                multiline
              />
            </View>
          ) : null}

          <Pressable style={[brandScreen.primaryBtn, styles.saveBtn]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={brandScreen.primaryBtnText}>保存（upsert）</Text>}
          </Pressable>

          <Text style={styles.note}>保存時は既存行を読み取り、入力内容を反映したうえで sasaeai_profiles を upsert（onConflict: id）します。</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 40 },
  head: { marginBottom: 16, gap: 8 },
  headTitle: { fontSize: 22, fontWeight: "900", color: "#111827" },
  headSub: { fontSize: 13, color: "#6b7280", lineHeight: 20 },
  errBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 12,
    marginBottom: 12,
  },
  errTxt: { color: "#991b1b", fontSize: 13 },
  lbl: { fontSize: 13, fontWeight: "700", color: "#374151", marginTop: 12, marginBottom: 6 },
  inp: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  area: { minHeight: 100, textAlignVertical: "top" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  chipOn: {
    borderColor: "#f472b6",
    backgroundColor: "#fce7f3",
  },
  chipTxt: { fontSize: 13, color: "#4b5563" },
  chipTxtOn: { color: "#9d174d", fontWeight: "700" },
  prefRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  prefChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  prefChipOn: { borderColor: "#60a5fa", backgroundColor: "#eff6ff" },
  prefChipTxt: { fontSize: 12, color: "#4b5563" },
  prefChipTxtOn: { color: "#1d4ed8", fontWeight: "700" },
  saveBtn: { marginTop: 20 },
  note: { fontSize: 11, color: "#9ca3af", marginTop: 12, lineHeight: 17, textAlign: "center" },
  photoHint: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 14,
  },
  photoBlock: {
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3e8ff",
  },
  photoPreviewWrap: {
    alignItems: "center",
    marginBottom: 10,
  },
  photoPreview: {
    width: "100%",
    maxWidth: 220,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  photoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  photoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#db2777",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  photoBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  photoBtnOutline: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  photoBtnOutlineTxt: { color: "#6b7280", fontWeight: "700", fontSize: 13 },
})
