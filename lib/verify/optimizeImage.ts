import * as ImageManipulator from "expo-image-manipulator"

import type { EkycDocumentKind } from "@/lib/verify/documentKyc"

/** 画像の役割（OCR 用バッチに添付するメタ） */
export type VerificationImageRole = "document_front" | "selfie"

export type OptimizeVerificationContext = {
  documentKind: EkycDocumentKind
  imageRole: VerificationImageRole
}

export type OptimizedVerificationImage = {
  uri: string
  documentKind: EkycDocumentKind
  imageRole: VerificationImageRole
}

/**
 * OCR / 顔照合用 API に送る前の前処理（解像度・容量の抑制）。
 * documentKind / imageRole を付与しておき、将来パイプラインで書類種別ごとに前処理を分岐しやすくする。
 */
export async function optimizeForVerificationPipeline(
  localUri: string,
  context: OptimizeVerificationContext,
): Promise<OptimizedVerificationImage> {
  // 免許証は文字小さめ、マイナカードは顔写真解像度が重要になりやすい → 現状は同じ出力で統一、必要なら context で width を分岐可能
  const maxWidth = context.documentKind === "my_number_card" ? 1800 : 1600

  const result = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: maxWidth } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
  )

  return {
    uri: result.uri,
    documentKind: context.documentKind,
    imageRole: context.imageRole,
  }
}
