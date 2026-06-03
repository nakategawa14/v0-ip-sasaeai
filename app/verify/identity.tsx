import FontAwesome from "@expo/vector-icons/FontAwesome"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Redirect, useRouter } from "expo-router"
import { useCallback, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useAuth } from "@/contexts/AuthContext"
import { TABLES } from "@/lib/constants/tables"
import {
  buildVerificationOcrJobPayload,
  DOCUMENT_META,
  ID1_CARD_ASPECT,
  ocrSimulationLine,
  type EkycDocumentKind,
} from "@/lib/verify/documentKyc"
import { optimizeForVerificationPipeline } from "@/lib/verify/optimizeImage"
import { supabase } from "@/lib/supabase"

export const options = {
  title: "本人確認（eKYC）",
}

function SecurityNotice() {
  return (
    <View style={styles.securityBox} accessibilityRole="summary">
      <FontAwesome name="lock" size={18} color="#1d4ed8" style={styles.securityIcon} />
      <View style={styles.securityTextWrap}>
        <Text style={styles.securityTitle}>お預かりした画像の取り扱い</Text>
        <Text style={styles.securityBody}>
          撮影した画像は
          <Text style={styles.securityEm}>本人確認の目的にのみ</Text>
          使用し、厳重に管理します。第三者に販売・公開することはありません。
        </Text>
      </View>
    </View>
  )
}

/** 中央に「穴」のある暗幕（ID-1 書類・セルフィー用ガイド） */
function FrameOverlay({ aspect, label }: { aspect: number; label: string }) {
  const { width: sw } = Dimensions.get("window")
  const holeW = sw * 0.88
  const holeH = holeW / aspect

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.dimFlex} />
      <View style={[styles.dimRow, { height: holeH }]}>
        <View style={styles.dimSide} />
        <View style={[styles.holeOutline, { width: holeW, height: holeH }]}>
          <Text style={styles.frameHint}>{label}</Text>
        </View>
        <View style={styles.dimSide} />
      </View>
      <View style={styles.dimFlex} />
    </View>
  )
}

function DocumentKindSelect({
  onSelect,
  onBack,
}: {
  onSelect: (kind: EkycDocumentKind) => void
  onBack: () => void
}) {
  return (
    <ScrollView style={styles.selectScroll} contentContainerStyle={styles.selectContent} keyboardShouldPersistTaps="handled">
      <SecurityNotice />
      <Text style={styles.selectTitle}>本人確認に使う書類を選んでください</Text>
      <Text style={styles.selectSub}>運転免許証とマイナンバーカードは同じ ID-1 サイズのため、撮影ガイドの形は共通です。OCR は書類ごとに別パイプラインで処理します。</Text>

      <Pressable
        style={styles.docCard}
        onPress={() => onSelect("drivers_license")}
        accessibilityRole="button"
        accessibilityLabel="運転免許証で本人確認"
      >
        <FontAwesome name="automobile" size={28} color="#db2777" />
        <View style={styles.docCardText}>
          <Text style={styles.docCardTitle}>{DOCUMENT_META.drivers_license.labelJa}</Text>
          <Text style={styles.docCardDesc}>{DOCUMENT_META.drivers_license.captureIntro}</Text>
        </View>
        <FontAwesome name="chevron-right" size={18} color="#9ca3af" />
      </Pressable>

      <Pressable
        style={styles.docCard}
        onPress={() => onSelect("my_number_card")}
        accessibilityRole="button"
        accessibilityLabel="マイナンバーカードで本人確認"
      >
        <FontAwesome name="credit-card" size={26} color="#2563eb" />
        <View style={styles.docCardText}>
          <Text style={styles.docCardTitle}>{DOCUMENT_META.my_number_card.labelJa}</Text>
          <Text style={styles.docCardDesc}>{DOCUMENT_META.my_number_card.captureIntro}</Text>
        </View>
        <FontAwesome name="chevron-right" size={18} color="#9ca3af" />
      </Pressable>

      <View style={styles.mynLegal}>
        <FontAwesome name="info-circle" size={16} color="#b45309" style={styles.mynLegalIcon} />
        <Text style={styles.mynLegalText}>
          マイナンバーカードを利用する際は、個人番号の取り扱い・撮影範囲について、最新の法令および総務省のガイドラインに従ってください。
        </Text>
      </View>

      <Pressable style={styles.secondaryBtn} onPress={onBack}>
        <Text style={styles.secondaryBtnText}>戻る</Text>
      </Pressable>
    </ScrollView>
  )
}

export default function IdentityVerifyScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<"back" | "front">("back")
  const [step, setStep] = useState<"selectDoc" | "document" | "selfie" | "analyzing" | "result">("selectDoc")
  const [documentKind, setDocumentKind] = useState<EkycDocumentKind | null>(null)
  const [documentFrontUri, setDocumentFrontUri] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [ocrLine, setOcrLine] = useState("")
  const [faceLine, setFaceLine] = useState("")
  const spin = useRef(new Animated.Value(0)).current

  const runSpin = useCallback(() => {
    spin.setValue(0)
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start()
  }, [spin])

  if (!user) {
    return <Redirect href="/(auth)/login" />
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#db2777" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, styles.pad]}>
        <SecurityNotice />
        <Text style={styles.permTitle}>カメラの許可が必要です</Text>
        <Text style={styles.permBody}>免許証またはマイナンバーカード、およびセルフィーの撮影のため、カメラへのアクセスを許可してください。</Text>
        <Pressable style={styles.primaryBtn} onPress={() => requestPermission()}>
          <Text style={styles.primaryBtnText}>許可する</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>戻る</Text>
        </Pressable>
      </View>
    )
  }

  if (step === "selectDoc") {
    return (
      <View style={[styles.selectRoot, { paddingTop: insets.top }]}>
        <DocumentKindSelect
          onSelect={(kind) => {
            setDocumentKind(kind)
            setFacing("back")
            setStep("document")
          }}
          onBack={() => router.back()}
        />
      </View>
    )
  }

  const capture = async () => {
    if (!cameraRef.current || busy) return
    setBusy(true)
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.92, skipProcessing: false })
      if (!photo?.uri) throw new Error("撮影に失敗しました")

      if (step === "document") {
        setDocumentFrontUri(photo.uri)
        setFacing("front")
        setStep("selfie")
      } else if (step === "selfie") {
        if (!documentKind || !documentFrontUri) {
          setStep("selectDoc")
          return
        }
        const selfieLocal = photo.uri
        setStep("analyzing")
        runSpin()
        try {
          const [docOpt, selfOpt] = await Promise.all([
            optimizeForVerificationPipeline(documentFrontUri, {
              documentKind,
              imageRole: "document_front",
            }),
            optimizeForVerificationPipeline(selfieLocal, { documentKind, imageRole: "selfie" }),
          ])
          const jobPayload = buildVerificationOcrJobPayload({
            documentKind,
            documentFrontOptimizedUri: docOpt.uri,
            selfieOptimizedUri: selfOpt.uri,
          })
          if (__DEV__) {
            console.log("[eKYC] OCR job skeleton:", jobPayload.ocrPipelineId, jobPayload.expectedFields)
          }
          void jobPayload
        } catch {
          /* 最適化失敗時もシミュレーションは続行 */
        }
        await new Promise((r) => setTimeout(r, 2800))
        setOcrLine(ocrSimulationLine(documentKind))
        setFaceLine(DOCUMENT_META[documentKind].faceMatchPhrase)

        const { error: upErr } = await supabase
          .from(TABLES.PROFILES)
          .update({ verification_status: "pending" })
          .eq("id", user.id)
        if (upErr) {
          console.warn("[eKYC] verification_status update skipped:", upErr.message)
        }

        setStep("result")
      }
    } catch (e) {
      console.warn(e)
    } finally {
      setBusy(false)
    }
  }

  const resetFlow = () => {
    setStep("selectDoc")
    setFacing("back")
    setDocumentKind(null)
    setDocumentFrontUri(null)
    setOcrLine("")
    setFaceLine("")
  }

  if (step === "analyzing") {
    const rotate = spin.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    })
    return (
      <View style={[styles.center, styles.analyzeBg]}>
        <SecurityNotice />
        <Animated.View style={{ transform: [{ rotate }] }}>
          <FontAwesome name="cog" size={48} color="#db2777" />
        </Animated.View>
        <Text style={styles.analyzeTitle}>解析中…</Text>
        <Text style={styles.analyzeSub}>
          {documentKind ? `${DOCUMENT_META[documentKind].labelJa}を確認するため、送信内容を処理しています` : "送信内容を確認するため処理しています"}
        </Text>
        <ActivityIndicator color="#db2777" style={{ marginTop: 16 }} />
      </View>
    )
  }

  if (step === "result") {
    return (
      <View style={[styles.resultWrap, { paddingTop: insets.top + 12 }]}>
        <SecurityNotice />
        <View style={styles.resultCard}>
          <FontAwesome name="check-circle" size={48} color="#16a34a" />
          <Text style={styles.resultTitle}>仮の判定が完了しました</Text>
          <Text style={styles.resultLine}>{ocrLine}</Text>
          <Text style={styles.resultLine}>{faceLine}</Text>
          <Text style={styles.resultNote}>
            申請を受け付けました。本人確認の結果はしばらくしてから反映されます。運営による確認が完了するまでお待ちください。
          </Text>
        </View>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace("/(tabs)/profile")}>
          <Text style={styles.primaryBtnText}>プロフィールへ</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={resetFlow}>
          <Text style={styles.secondaryBtnText}>最初からやり直す</Text>
        </Pressable>
      </View>
    )
  }

  if (!documentKind) {
    return (
      <View style={styles.center}>
        <Text style={styles.permBody}>書類が未選択です。最初からやり直してください。</Text>
        <Pressable style={styles.primaryBtn} onPress={resetFlow}>
          <Text style={styles.primaryBtnText}>書類選択へ</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} mode="picture" />

      {step === "document" ? (
        <FrameOverlay aspect={ID1_CARD_ASPECT} label={DOCUMENT_META[documentKind].frameHint} />
      ) : (
        <FrameOverlay aspect={1} label="顔がはっきり写るよう枠内に収めてください" />
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <SecurityNotice />
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.stepLabel}>
          {step === "document" ? "ステップ 2 / 4" : "ステップ 3 / 4"}
        </Text>
        <Text style={styles.stepTitle}>
          {step === "document" ? `${DOCUMENT_META[documentKind].labelJa}（表面）` : "セルフィー（自撮り）"}
        </Text>
        <Pressable
          style={[styles.shutter, busy && styles.shutterDisabled]}
          onPress={capture}
          disabled={busy}
          accessibilityLabel="シャッター"
        >
          {busy ? <ActivityIndicator color="#111" /> : <View style={styles.shutterInner} />}
        </Pressable>
        {step === "selfie" ? (
          <Pressable
            style={styles.backStep}
            onPress={() => {
              setStep("document")
              setFacing("back")
              setDocumentFrontUri(null)
            }}
          >
            <Text style={styles.backStepText}>書類の撮影に戻る</Text>
          </Pressable>
        ) : null}
      </View>

      {documentFrontUri && step === "selfie" ? (
        <View style={styles.thumbCorner} pointerEvents="none">
          <Image source={{ uri: documentFrontUri }} style={styles.thumb} />
          <Text style={styles.thumbCap}>{DOCUMENT_META[documentKind].shortLabel} 表面 撮影済</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  selectRoot: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  selectScroll: {
    flex: 1,
  },
  selectContent: {
    padding: 16,
    paddingBottom: 32,
  },
  selectTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginTop: 8,
    marginBottom: 8,
  },
  selectSub: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docCardText: {
    flex: 1,
    minWidth: 0,
  },
  docCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  docCardDesc: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
  mynLegal: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  mynLegalIcon: {
    marginTop: 2,
  },
  mynLegalText: {
    flex: 1,
    fontSize: 11,
    color: "#92400e",
    lineHeight: 17,
  },
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fdf2f8",
  },
  pad: { paddingHorizontal: 20 },
  permTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    textAlign: "center",
  },
  permBody: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  dimRow: {
    flexDirection: "row",
    width: "100%",
  },
  dimSide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  holeOutline: {
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 10,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  dimFlex: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  frameHint: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 2,
    paddingHorizontal: 12,
  },
  securityBox: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  securityIcon: {
    marginTop: 2,
  },
  securityTextWrap: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e3a8a",
    marginBottom: 4,
  },
  securityBody: {
    fontSize: 12,
    color: "#1e40af",
    lineHeight: 18,
  },
  securityEm: {
    fontWeight: "800",
    color: "#1d4ed8",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingTop: 12,
  },
  stepLabel: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "600",
  },
  stepTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#fce7f3",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterDisabled: { opacity: 0.6 },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#db2777",
  },
  backStep: { marginTop: 12, padding: 8 },
  backStepText: { color: "#93c5fd", fontSize: 14, fontWeight: "600" },
  thumbCorner: {
    position: "absolute",
    right: 12,
    top: 160,
    zIndex: 3,
    alignItems: "center",
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  thumbCap: {
    marginTop: 4,
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#db2777",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 12,
    minWidth: 220,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: { marginTop: 10, padding: 10 },
  secondaryBtnText: { color: "#6b7280", fontSize: 15, fontWeight: "600" },
  analyzeBg: {
    backgroundColor: "#fdf2f8",
  },
  analyzeTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  analyzeSub: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  resultWrap: {
    flex: 1,
    backgroundColor: "#fdf2f8",
    paddingHorizontal: 16,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 20,
    alignItems: "center",
    marginTop: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  resultLine: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 6,
    fontWeight: "600",
  },
  resultNote: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 12,
    lineHeight: 17,
    textAlign: "center",
  },
})
