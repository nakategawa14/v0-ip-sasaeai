"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"

export async function recordProfileView(viewedProfileId: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.id === viewedProfileId) {
    return { success: false, error: "認証エラーまたは自分自身のプロフィールです" }
  }

  // 最近の訪問履歴をチェック（24時間以内に同じユーザーのプロフィールを訪問していたら記録しない）
  const { data: recentView } = await supabase
    .from(TABLES.PROFILE_VIEWS)
    .select("id")
    .eq("viewer_id", user.id)
    .eq("viewed_profile_id", viewedProfileId)
    .gte("viewed_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .single()

  if (recentView) {
    return { success: true, message: "最近訪問済み" }
  }

  const { error } = await supabase.from(TABLES.PROFILE_VIEWS).insert({
    viewer_id: user.id,
    viewed_profile_id: viewedProfileId,
  })

  if (error) {
    console.error("Profile view recording error:", error)
    return { success: false, error: "訪問履歴の記録に失敗しました" }
  }

  await createNotification(
    viewedProfileId,
    "profile_view",
    "プロフィール訪問",
    "あなたのプロフィールが閲覧されました",
    "/profile/visitors",
    user.id,
  )

  revalidatePath("/profile/visitors")
  return { success: true }
}

export async function getProfileVisitors(limit = 20) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { visitors: [], error: "認証が必要です" }
  }

  const { data, error } = await supabase
    .from(TABLES.PROFILE_VIEWS)
    .select(
      `
      id,
      viewed_at,
      viewer:viewer_id (
        id,
        sasaeai_profiles (
          nickname,
          avatar_url,
          age,
          gender,
          prefecture,
          is_verified
        )
      )
    `,
    )
    .eq("viewed_profile_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Get profile visitors error:", error)
    return { visitors: [], error: "訪問者の取得に失敗しました" }
  }

  return { visitors: data || [], error: null }
}
