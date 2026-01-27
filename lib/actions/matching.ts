"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"

export async function sendLike(targetProfileId: string) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("認証が必要です")
  }

  // 自分のプロフィールを取得
  const { data: myProfile } = await supabase.from(TABLES.PROFILES).select("id, nickname").eq("id", user.id).single()

  if (!myProfile) {
    throw new Error("プロフィールが見つかりません")
  }

  // いいねを送信
  const { error: likeError } = await supabase.from(TABLES.LIKES).insert({
    from_user_id: user.id,
    to_user_id: targetProfileId,
    created_at: new Date().toISOString(),
  })

  if (likeError) {
    console.error("いいね送信エラー:", likeError)
    throw new Error("いいねの送信に失敗しました")
  }

  // いいね通知を送信
  await createNotification(
    targetProfileId,
    "like_received",
    "いいねを受け取りました",
    `${myProfile.nickname || "誰か"}さんからいいねが届きました`,
    "/likes",
    user.id,
  )

  // 相手から自分へのいいねがあるかチェック（マッチング判定）
  const { data: reverseLike } = await supabase
    .from(TABLES.LIKES)
    .select("id")
    .eq("from_user_id", targetProfileId)
    .eq("to_user_id", user.id)
    .single()

  let isMatch = false

  if (reverseLike) {
    // マッチング成立! sasaeai_matchesに登録
    // user1_idは小さいIDを使用して重複を防止
    const [smallerId, largerId] = [user.id, targetProfileId].sort()

    const { error: matchError } = await supabase.from(TABLES.MATCHES).insert({
      user1_id: smallerId,
      user2_id: largerId,
      matched_at: new Date().toISOString(),
      is_active: true,
    })

    if (matchError) {
      // 既にマッチが存在する場合はエラーを無視
      if (!matchError.message.includes("duplicate")) {
        console.error("マッチ作成エラー:", matchError)
      }
    } else {
      isMatch = true

      // 相手に通知
      const { data: targetProfile } = await supabase
        .from(TABLES.PROFILES)
        .select("nickname")
        .eq("id", targetProfileId)
        .single()

      await createNotification(
        targetProfileId,
        "match",
        "マッチング成立!",
        `${myProfile.nickname || "誰か"}さんとマッチングしました。メッセージを送ってみましょう!`,
        "/matches",
        user.id,
      )

      // 自分にも通知
      await createNotification(
        user.id,
        "match",
        "マッチング成立!",
        `${targetProfile?.nickname || "誰か"}さんとマッチングしました。メッセージを送ってみましょう!`,
        "/matches",
        targetProfileId,
      )
    }
  }

  revalidatePath("/likes")
  revalidatePath("/matches")
  revalidatePath("/search")

  return { isMatch }
}

export async function removeLike(targetProfileId: string) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("認証が必要です")
  }

  // いいねを削除
  const { error } = await supabase
    .from(TABLES.LIKES)
    .delete()
    .eq("from_user_id", user.id)
    .eq("to_user_id", targetProfileId)

  if (error) {
    console.error("いいね削除エラー:", error)
    throw new Error("いいねの削除に失敗しました")
  }

  revalidatePath("/likes")
  revalidatePath("/search")
}

// マッチを解除する関数
export async function unmatch(matchId: string) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("認証が必要です")
  }

  // マッチを非アクティブに設定
  const { error } = await supabase
    .from(TABLES.MATCHES)
    .update({ is_active: false })
    .eq("id", matchId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

  if (error) {
    console.error("マッチ解除エラー:", error)
    throw new Error("マッチの解除に失敗しました")
  }

  revalidatePath("/matches")
}
