import * as ImageManipulator from "expo-image-manipulator"

import { supabase } from "@/lib/supabase"

/** Supabase Storage の公開バケット名（ダッシュボードで作成し、認証ユーザーに upload / 全員 read を付与してください） */
const PROFILE_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_PROFILE_BUCKET ?? "profile-images"

/**
 * ライブラリで選んだ画像をリサイズして Storage に上げ、公開 URL を返す。
 */
export async function uploadProfileSlotFromUri(userId: string, slot: 1 | 2 | 3, localUri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: slot === 1 ? 1200 : 1000 } }],
    { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
  )

  const res = await fetch(manipulated.uri)
  const buf = await res.arrayBuffer()

  const path = `${userId}/slot${slot}_${Date.now()}.jpg`
  const { error } = await supabase.storage.from(PROFILE_BUCKET).upload(path, buf, {
    contentType: "image/jpeg",
    upsert: true,
  })

  if (error) {
    throw new Error(
      error.message.includes("Bucket not found") || error.message.includes("not found")
        ? `ストレージバケット「${PROFILE_BUCKET}」が見つかりません。Supabase でバケットを作成するか、.env の EXPO_PUBLIC_SUPABASE_PROFILE_BUCKET を設定してください。`
        : error.message,
    )
  }

  const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
