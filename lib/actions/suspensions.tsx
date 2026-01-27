"use server"

import { createServerClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { logModerationAction } from "./moderation-logs"
import { sendEmail } from "@/lib/email/send-email"

export type SuspensionDuration = "7days" | "30days" | "90days" | "permanent"

export interface Suspension {
  id: string
  user_id: string
  type: "temporary" | "permanent"
  reason: string
  suspended_at: string
  expires_at: string | null
  lifted_at: string | null
  lifted_by: string | null
  lift_reason: string | null
  suspended_by: string
}

// 停止を作成
export async function createSuspension(
  userId: string,
  type: "temporary" | "permanent",
  reason: string,
  durationDays?: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "認証が必要です" }
  }

  // 管理者チェック
  const { data: adminProfile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!adminProfile?.is_admin) {
    return { success: false, error: "管理者権限が必要です" }
  }

  // 対象ユーザーの情報を取得
  const { data: targetUser } = await supabase.from(TABLES.PROFILES).select("nickname, email").eq("id", userId).single()

  // 有効期限を計算
  let expiresAt: string | null = null
  if (type === "temporary" && durationDays) {
    const expireDate = new Date()
    expireDate.setDate(expireDate.getDate() + durationDays)
    expiresAt = expireDate.toISOString()
  }

  // 停止レコードを作成
  const { error: insertError } = await supabase.from(TABLES.SUSPENSIONS).insert({
    user_id: userId,
    type,
    reason,
    expires_at: expiresAt,
    suspended_by: user.id,
  })

  if (insertError) {
    console.error("Suspension insert error:", insertError)
    return { success: false, error: "停止の作成に失敗しました" }
  }

  // プロフィールを非アクティブに更新
  await supabase.from(TABLES.PROFILES).update({ is_active: false }).eq("id", userId)

  // モデレーションログを記録
  await logModerationAction(
    type === "permanent" ? "permanent_ban" : "temporary_suspension",
    userId,
    `${type === "permanent" ? "永久BAN" : `${durationDays}日間の一時停止`}: ${reason}`,
  )

  // ユーザーにメールを送信
  if (targetUser?.email) {
    const emailSubject =
      type === "permanent" ? "【ささえ愛】アカウント停止のお知らせ" : "【ささえ愛】アカウント一時停止のお知らせ"

    const emailBody =
      type === "permanent"
        ? `
      <p>${targetUser.nickname}様</p>
      <p>あなたのアカウントは、利用規約違反により停止されました。</p>
      <p><strong>停止理由:</strong> ${reason}</p>
      <p>ご不明な点がございましたら、サポートまでお問い合わせください。</p>
    `
        : `
      <p>${targetUser.nickname}様</p>
      <p>あなたのアカウントは一時停止されました。</p>
      <p><strong>停止理由:</strong> ${reason}</p>
      <p><strong>停止期間:</strong> ${durationDays}日間</p>
      <p><strong>解除予定:</strong> ${new Date(expiresAt!).toLocaleDateString("ja-JP")}</p>
      <p>停止期間終了後、再度ログインできるようになります。</p>
    `

    await sendEmail({
      to: targetUser.email,
      subject: emailSubject,
      html: emailBody,
    })
  }

  return { success: true }
}

// 停止を解除
export async function liftSuspension(
  suspensionId: string,
  liftReason: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "認証が必要です" }
  }

  // 管理者チェック
  const { data: adminProfile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!adminProfile?.is_admin) {
    return { success: false, error: "管理者権限が必要です" }
  }

  // 停止レコードを取得
  const { data: suspension } = await supabase
    .from(TABLES.SUSPENSIONS)
    .select("*, user:user_id(nickname, email)")
    .eq("id", suspensionId)
    .single()

  if (!suspension) {
    return { success: false, error: "停止レコードが見つかりません" }
  }

  // 停止を解除
  const { error: updateError } = await supabase
    .from(TABLES.SUSPENSIONS)
    .update({
      lifted_at: new Date().toISOString(),
      lifted_by: user.id,
      lift_reason: liftReason,
    })
    .eq("id", suspensionId)

  if (updateError) {
    return { success: false, error: "停止の解除に失敗しました" }
  }

  // プロフィールをアクティブに更新
  await supabase.from(TABLES.PROFILES).update({ is_active: true }).eq("id", suspension.user_id)

  // モデレーションログを記録
  await logModerationAction("lift_suspension", suspension.user_id, `停止解除: ${liftReason}`)

  // ユーザーにメールを送信
  const userInfo = suspension.user as any
  if (userInfo?.email) {
    await sendEmail({
      to: userInfo.email,
      subject: "【ささえ愛】アカウント停止解除のお知らせ",
      html: `
        <p>${userInfo.nickname}様</p>
        <p>あなたのアカウント停止が解除されました。</p>
        <p>再度ログインしてサービスをご利用いただけます。</p>
        <p>今後ともささえ愛をよろしくお願いいたします。</p>
      `,
    })
  }

  return { success: true }
}

// 現在有効な停止を取得
export async function getActiveSuspension(userId: string): Promise<Suspension | null> {
  const supabase = await createServerClient()

  const { data } = await supabase
    .from(TABLES.SUSPENSIONS)
    .select("*")
    .eq("user_id", userId)
    .is("lifted_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("suspended_at", { ascending: false })
    .limit(1)
    .single()

  return data
}

// 期限切れの一時停止を自動解除
export async function autoLiftExpiredSuspensions(): Promise<{ lifted: number }> {
  const supabase = await createServerClient()

  const now = new Date().toISOString()

  // 期限切れの停止を取得
  const { data: expiredSuspensions } = await supabase
    .from(TABLES.SUSPENSIONS)
    .select("id, user_id")
    .eq("type", "temporary")
    .is("lifted_at", null)
    .lt("expires_at", now)

  if (!expiredSuspensions || expiredSuspensions.length === 0) {
    return { lifted: 0 }
  }

  // 各停止を解除
  for (const suspension of expiredSuspensions) {
    await supabase
      .from(TABLES.SUSPENSIONS)
      .update({
        lifted_at: now,
        lift_reason: "期限切れによる自動解除",
      })
      .eq("id", suspension.id)

    await supabase.from(TABLES.PROFILES).update({ is_active: true }).eq("id", suspension.user_id)
  }

  return { lifted: expiredSuspensions.length }
}

// 停止中ユーザー一覧を取得
export async function getActiveSuspensions(): Promise<(Suspension & { user_nickname: string; user_email: string })[]> {
  const supabase = await createServerClient()

  const { data } = await supabase
    .from(TABLES.SUSPENSIONS)
    .select("*")
    .is("lifted_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("suspended_at", { ascending: false })

  if (!data) return []

  // ユーザー情報を取得
  const userIds = data.map((s) => s.user_id)
  const { data: users } = await supabase.from(TABLES.PROFILES).select("id, nickname, email").in("id", userIds)

  const userMap = new Map(users?.map((u) => [u.id, u]) || [])

  return data.map((s) => ({
    ...s,
    user_nickname: userMap.get(s.user_id)?.nickname || "不明",
    user_email: userMap.get(s.user_id)?.email || "不明",
  }))
}

// ユーザーの警告回数を取得
export async function getUserWarningCount(userId: string): Promise<number> {
  const supabase = await createServerClient()

  const { count } = await supabase
    .from(TABLES.WARNINGS)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  return count || 0
}

export async function suspendUser({
  userId,
  duration,
  reason,
  warningCount = 0,
}: {
  userId: string
  duration: SuspensionDuration
  reason: string
  warningCount?: number
}): Promise<{ success: boolean; error?: string }> {
  const durationDays = duration === "7days" ? 7 : duration === "30days" ? 30 : duration === "90days" ? 90 : undefined

  const type = duration === "permanent" ? "permanent" : "temporary"

  return createSuspension(userId, type, reason, durationDays)
}
