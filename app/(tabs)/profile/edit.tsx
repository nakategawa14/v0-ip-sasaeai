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
  Switch,
  Text,
  TextInput,
  View,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { SafeAreaView } from "react-native-safe-area-context"

import { BrandLogo } from "@/components/brand/BrandLogo"
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
import { isLikelyImageFetchUrl, profileImagesAsUrlCandidates } from "@/lib/profile/display"
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

async function resolveSlotImageUrl(
  userId: string,
  slot: 1 | 2 | 3,
  pendingUri: string | null,
  remoteImage: string,
): Promise<string | null> {
  if (pendingUri) {
    return await uploadProfileSlotFromUri(userId, slot, pendingUri)
  }
  const trimmed = remoteImage.trim()
  if (trimmed && isLikelyImageFetchUrl(trimmed)) {
    return trimmed
  }
  return null
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
  const [secretMode, setSecretMode] = useState(false)

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
    setSecretMode(data.is_secret_mode === true)
    const imgArr = profileImagesAsUrlCandidates(data.profile_images)
    setRemoteImage1(imgArr[0]?.trim() ?? "")
    setRemoteImage2(imgArr[1]?.trim() ?? "")
    setRemoteImage3(imgArr[2]?.trim() ?? "")
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
    console.log("[SAVE START]")
    if (!user?.id || !user.email) {
      Alert.alert("エラー", "ログイン情報がありません")
      return
    }
    if (!prefecture.trim()) {
      setError("都道府県は必須です")
      Alert.alert("エラー", "都道府県を選択してください")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const {
        data: { user: authUser },
        error: authErr,
      } = await supabase.auth.getUser()
      if (authErr || !authUser?.id) {
        const m = authErr?.message ?? "認証情報の取得に失敗しました"
        setError(m)
        Alert.alert("エラー", m)
        return
      }
      if (authUser.id !== user.id) {
        const m = "認証ユーザーIDと更新対象IDが一致しません。再ログインしてお試しください。"
        setError(m)
        Alert.alert("エラー", m)
        return
      }

      const nextPrefecture = prefecture.trim()
      const nextCity = city.trim() || null

      const profileImages: string[] = []
      for (const { slot, pending, remote } of [
        { slot: 1 as const, pending: pendingUri1, remote: remoteImage1 },
        { slot: 2 as const, pending: pendingUri2, remote: remoteImage2 },
        { slot: 3 as const, pending: pendingUri3, remote: remoteImage3 },
      ]) {
        const url = await resolveSlotImageUrl(user.id, slot, pending, remote)
        if (url) profileImages.push(url)
      }
      console.log("[SAVE IMAGES]", profileImages)

      const payload = {
        prefecture: nextPrefecture,
        city: nextCity,
        profile_images: profileImages.length > 0 ? profileImages : null,
      }
      console.log("[SAVE PAYLOAD]", payload)

      const { error: upErr } = await supabase.from(TABLES.PROFILES).update(payload).eq("id", user.id)
      if (upErr) {
        const m = upErr?.message ?? "プロフィールの更新に失敗しました"
        setError(m)
        Alert.alert("エラー", m)
        return
      }
      console.log("[SAVE SUCCESS]")
      router.replace("/(tabs)/profile")
    } catch (e) {
      console.error("[SAVE ERROR]", e)
      const message = e instanceof Error ? e.message : String(e)
      setError(message)
      Alert.alert("エラー", message)
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
            <BrandLogo size={28} />
            <Text style={styles.headTitle}>プロフィールを編集</Text>
            <Text style={styles.headSub}>
              基本情報に加え、メイン・サブ写真（最大3枚）をライブラリから選べます。保存するとプロフィールに反映されます。
            </Text>
          </View>

          <View style={brandScreen.card}>
            <Text style={brandScreen.sectionTitle}>プロフィール写真</Text>
            <Text style={styles.photoHint}>
              メイン写真は 1 枚目（一覧などに表示）、サブ写真は 2・3 枚目です。選択した画像は自動的にアップロードされます。
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
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={prefecture || ""}
                onValueChange={(itemValue) => setPrefecture(String(itemValue))}
                style={styles.picker}
              >
                <Picker.Item label="都道府県を選択してください" value="" />
                {PREFECTURES.map((p) => (
                  <Picker.Item key={p} label={p} value={p} />
                ))}
              </Picker>
            </View>

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

          <View style={brandScreen.card}>
            <Text style={brandScreen.sectionTitle}>シークレットモード</Text>
            <Text style={styles.secretHint}>
              ON にすると「さがす」一覧や他者からのプロフィール閲覧では、あなたが「いいね」した相手にだけあなたが表示されます（未ログインの閲覧者には表示されません）。
            </Text>
            <View style={styles.secretRow}>
              <Text style={styles.secretLabel}>シークレットモードを有効にする</Text>
              <Switch
                accessibilityLabel="シークレットモード"
                value={secretMode}
                onValueChange={setSecretMode}
                trackColor={{ false: "#e5e7eb", true: "#fbcfe8" }}
                thumbColor={secretMode ? "#db2777" : "#f3f4f6"}
              />
            </View>
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

          <Pressable
            style={[brandScreen.primaryBtn, styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={() => {
              void save()
            }}
            disabled={saving}
            accessibilityState={{ disabled: saving, busy: saving }}
          >
            {saving ? (
              <View style={styles.savingRow}>
                <ActivityIndicator color="#fff" />
                <Text style={brandScreen.primaryBtnText}>保存中...</Text>
              </View>
            ) : (
              <Text style={brandScreen.primaryBtnText}>保存</Text>
            )}
          </Pressable>

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
  secretHint: { fontSize: 13, color: "#6b7280", lineHeight: 20, marginBottom: 12 },
  secretRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
  },
  secretLabel: { flex: 1, fontSize: 15, fontWeight: "700", color: "#111827" },
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
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
  },
  saveBtn: { marginTop: 20 },
  saveBtnDisabled: { opacity: 0.7 },
  savingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
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
