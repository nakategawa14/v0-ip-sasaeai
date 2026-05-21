"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { TABLES } from "@/lib/supabase/table-names"
import { OPERATOR_INFO } from "@/lib/legal/operator-info"
import { sendEmail, generateEmailHtml } from "@/lib/email/send-email"
import { logModerationAction } from "@/lib/actions/moderation-logs"

function isSasaeaiAdmin(profile: { is_admin?: boolean | null } | null | undefined): boolean {
  return profile?.is_admin === true
}

function orderedPair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA]
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false as const, error: "ログインが必要です", adminId: null, supabase }
  }
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()
  if (!isSasaeaiAdmin(profile)) {
    return { ok: false as const, error: "管理者権限が必要です", adminId: null, supabase }
  }
  return { ok: true as const, error: null, adminId: user.id, supabase }
}

async function ensureOfficialMatch(opsUserId: string, targetUserId: string): Promise<{ matchId: string } | { error: string }> {
  let svc: ReturnType<typeof createServiceRoleClient>
  try {
    svc = createServiceRoleClient()
  } catch {
    return { error: "サーバー設定（SUPABASE_SERVICE_ROLE_KEY）が不足しています" }
  }

  const [u1, u2] = orderedPair(opsUserId, targetUserId)
  const { data: existing } = await svc.from(TABLES.MATCHES).select("id").eq("user1_id", u1).eq("user2_id", u2).maybeSingle()
  if (existing?.id) {
    return { matchId: existing.id }
  }

  const { data: inserted, error } = await svc
    .from(TABLES.MATCHES)
    .insert({
      user1_id: u1,
      user2_id: u2,
      is_active: true,
      matched_at: new Date().toISOString(),
      status: "matched",
    })
    .select("id")
    .single()

  if (error || !inserted) {
    console.error("[adminSendOfficialDm] match insert", error)
    return { error: error?.message ?? "マッチの作成に失敗しました（運営用ユーザーID・外部キーを確認してください）" }
  }
  return { matchId: inserted.id }
}

/** 運営事務局名義で対象ユーザーにアプリ内DM（既存のマッチ＋メッセージ） */
export async function adminSendOfficialDm(params: {
  targetUserId: string
  reportId: string
  body: string
}) {
  const gate = await requireAdmin()
  if (!gate.ok || !gate.adminId) {
    return { success: false as const, error: gate.error ?? "権限エラー" }
  }

  const text = params.body.trim()
  if (!text) {
    return { success: false as const, error: "本文を入力してください" }
  }

  const opsId = process.env.SASAEAI_OPERATIONS_USER_ID?.trim()
  if (!opsId) {
    return {
      success: false as const,
      error:
        "環境変数 SASAEAI_OPERATIONS_USER_ID（運営公式アカウントの auth / profiles の UUID）が未設定です。Supabase で運営用ユーザーを1件作成し .env に設定してください。",
    }
  }

  if (opsId === params.targetUserId) {
    return { success: false as const, error: "運営アカウント自身には送信できません" }
  }

  const matchResult = await ensureOfficialMatch(opsId, params.targetUserId)
  if ("error" in matchResult) {
    return { success: false as const, error: matchResult.error }
  }

  let svc: ReturnType<typeof createServiceRoleClient>
  try {
    svc = createServiceRoleClient()
  } catch {
    return { success: false as const, error: "SUPABASE_SERVICE_ROLE_KEY が設定されていません" }
  }

  const { error: msgErr } = await svc.from(TABLES.MESSAGES).insert({
    match_id: matchResult.matchId,
    sender_id: opsId,
    content: `[運営事務局]\n${text}`,
    is_read: false,
  })

  if (msgErr) {
    console.error("[adminSendOfficialDm] message insert", msgErr)
    return { success: false as const, error: msgErr.message ?? "メッセージの送信に失敗しました" }
  }

  await svc.from(TABLES.NOTIFICATIONS).insert({
    user_id: params.targetUserId,
    type: "message",
    title: "運営事務局からメッセージ",
    message: text.length > 120 ? `${text.slice(0, 120)}…` : text,
    link: `/messages/${matchResult.matchId}`,
    related_user_id: opsId,
  })

  await logModerationAction({
    actionType: "admin_official_dm",
    targetUserId: params.targetUserId,
    targetReportId: params.reportId,
    details: {
      match_id: matchResult.matchId,
      length: text.length,
      preview: text.slice(0, 500),
    },
    notes: "運営公式DM",
  })

  revalidatePath("/admin/reports", "page")
  revalidatePath(`/admin/reports/${params.reportId}`, "page")
  revalidatePath("/admin/moderation-logs")
  return { success: true as const, matchId: matchResult.matchId }
}

/** 登録メールへ注意喚起（送信元表示は運営名、返信先は OPERATOR_INFO.email） */
export async function adminSendWarningEmail(params: {
  targetUserId: string
  targetEmail: string
  reportId: string
  subject: string
  body: string
}) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return { success: false as const, error: gate.error ?? "権限エラー" }
  }

  const subject = params.subject.trim() || "【ささえ愛】アカウントに関する重要なお知らせ"
  const body = params.body.trim()
  if (!body) {
    return { success: false as const, error: "本文を入力してください" }
  }
  if (!params.targetEmail?.trim()) {
    return { success: false as const, error: "対象ユーザーのメールアドレスがありません" }
  }

  const html = await generateEmailHtml({
    title: subject,
    content: `<p>${body.replace(/\n/g, "<br/>")}</p><p style="margin-top:24px;font-size:13px;color:#6b7280;">本メールは運営より登録アドレス宛に送信されています。返信は ${OPERATOR_INFO.email} までお願いします。</p>`,
  })

  const mailFromName = OPERATOR_INFO.name
  const fromEmail = process.env.MAILERSEND_FROM_EMAIL?.trim() || undefined

  const sent = await sendEmail({
    to: params.targetEmail.trim(),
    subject,
    html,
    fromName: mailFromName,
    fromEmail,
    replyTo: { email: OPERATOR_INFO.email, name: OPERATOR_INFO.name },
  })

  if (!sent.success) {
    return { success: false as const, error: sent.error ?? "メール送信に失敗しました" }
  }

  await logModerationAction({
    actionType: "admin_warning_email",
    targetUserId: params.targetUserId,
    targetReportId: params.reportId,
    details: {
      to: params.targetEmail.trim(),
      subject,
      length: body.length,
    },
    notes: "注意喚起メール",
  })

  revalidatePath("/admin/reports", "page")
  revalidatePath(`/admin/reports/${params.reportId}`, "page")
  revalidatePath("/admin/moderation-logs")
  return { success: true as const }
}

/** 強制退会：プロフィール無効化＋Auth セッション無効化（ban） */
export async function adminForceDeactivateUser(params: { targetUserId: string; reportId: string }) {
  const gate = await requireAdmin()
  if (!gate.ok || !gate.adminId) {
    return { success: false as const, error: gate.error ?? "権限エラー" }
  }

  if (params.targetUserId === gate.adminId) {
    return { success: false as const, error: "自分自身は対象にできません" }
  }

  let svc: ReturnType<typeof createServiceRoleClient>
  try {
    svc = createServiceRoleClient()
  } catch {
    return { success: false as const, error: "SUPABASE_SERVICE_ROLE_KEY が設定されていません" }
  }

  const { error: profErr } = await svc
    .from(TABLES.PROFILES)
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", params.targetUserId)

  if (profErr) {
    console.error("[adminForceDeactivateUser] profile", profErr)
    return { success: false as const, error: profErr.message ?? "プロフィールの更新に失敗しました" }
  }

  const { error: banErr } = await svc.auth.admin.updateUserById(params.targetUserId, {
    ban_duration: "876000h",
  })

  if (banErr) {
    console.error("[adminForceDeactivateUser] auth ban", banErr)
    await logModerationAction({
      actionType: "user_forced_deactivation",
      targetUserId: params.targetUserId,
      targetReportId: params.reportId,
      details: { profile_updated: true, auth_ban_error: banErr.message },
      notes: "強制退会（Auth ban は一部失敗の可能性）",
    })
    revalidatePath("/admin/reports", "page")
    revalidatePath(`/admin/reports/${params.reportId}`, "page")
    revalidatePath("/admin/moderation-logs")
    return {
      success: true as const,
      warning: `プロフィールは無効化しましたが、セッション強制終了（ban）でエラー: ${banErr.message}`,
    }
  }

  await logModerationAction({
    actionType: "user_forced_deactivation",
    targetUserId: params.targetUserId,
    targetReportId: params.reportId,
    details: { profile_updated: true, auth_banned: true },
    notes: "強制退会",
  })

  revalidatePath("/admin/reports", "page")
  revalidatePath(`/admin/reports/${params.reportId}`, "page")
  revalidatePath("/admin/moderation-logs")
  return { success: true as const }
}
