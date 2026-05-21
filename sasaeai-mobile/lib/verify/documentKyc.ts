/**
 * eKYC で扱う公的個人認証用書類（運転免許証 / マイナンバーカード）。
 * いずれも ISO/IEC 7810 ID-1 寸法（85.60mm × 53.98mm）のため撮影ガイドのアスペクト比は共通でよい。
 * OCR パイプライン側では documentKind でテンプレート・期待フィールドを切り替える。
 */
export type EkycDocumentKind = "drivers_license" | "my_number_card"

/** ID-1（免許証・マイナンバーカード実物の比率） */
export const ID1_CARD_ASPECT = 85.6 / 53.98

export const DOCUMENT_META: Record<
  EkycDocumentKind,
  {
    labelJa: string
    shortLabel: string
    /** 撮影前にユーザーへ見せる説明 */
    captureIntro: string
    /** カメラ枠内の短いヒント */
    frameHint: string
    /** 顔照合結果の説明文（シミュレーション用） */
    faceMatchPhrase: string
    /** 将来の OCR ジョブで渡す識別子（Vision 用プロンプトや Custom Detector 名など） */
    ocrPipelineId: string
    /** 期待する主な抽出フィールド（実装時のチェックリスト） */
    ocrExpectedFields: readonly string[]
  }
> = {
  drivers_license: {
    labelJa: "運転免許証",
    shortLabel: "免許証",
    captureIntro: "表面（写真・氏名・住所・生年月日が写る面）を水平に、反射を避けて撮影してください。",
    frameHint: "枠内に免許証（表面）を収めてください",
    faceMatchPhrase: "顔照合：免許証の写真とセルフィーの一致率 95%（シミュレーション）",
    ocrPipelineId: "jp_drivers_license_front_v1",
    ocrExpectedFields: ["氏名", "住所", "生年月日", "交付年月日", "有効期限", "免許の条件等"] as const,
  },
  my_number_card: {
    labelJa: "マイナンバーカード",
    shortLabel: "マイナカード",
    captureIntro:
      "表面のみを撮影してください。個人番号（12桁）が写り込まないよう、カード位置にご注意ください（法令・運用に従い実装を調整してください）。",
    frameHint: "枠内にマイナンバーカード（表面）を収めてください",
    faceMatchPhrase: "顔照合：マイナンバーカードの顔写真とセルフィーの一致率 95%（シミュレーション）",
    ocrPipelineId: "jp_my_number_card_front_v1",
    ocrExpectedFields: ["氏名", "住所", "生年月日", "性別", "顔写真"] as const,
  },
}

export function ocrSimulationLine(kind: EkycDocumentKind): string {
  if (kind === "drivers_license") {
    return "OCR判定：免許証から18歳以上であることを確認（シミュレーション）"
  }
  return "OCR判定：マイナンバーカード（表面）から18歳以上であることを確認（シミュレーション）"
}

/**
 * 将来 Cloud Vision / 独自 OCR / Face API に送る JSON の骨格。
 * 画像はこの時点では URI／バイト化前のメタのみ（実装時に storage に上げて URL を差し替え）。
 */
export function buildVerificationOcrJobPayload(input: {
  documentKind: EkycDocumentKind
  documentFrontOptimizedUri: string
  selfieOptimizedUri: string
}) {
  const meta = DOCUMENT_META[input.documentKind]
  return {
    version: 1 as const,
    documentKind: input.documentKind,
    ocrPipelineId: meta.ocrPipelineId,
    expectedFields: [...meta.ocrExpectedFields],
    images: {
      documentFront: { localUri: input.documentFrontOptimizedUri, role: "document_front" as const },
      selfie: { localUri: input.selfieOptimizedUri, role: "selfie" as const },
    },
  }
}
