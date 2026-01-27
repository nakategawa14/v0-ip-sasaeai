import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { notifyUserVerificationApproved } from "@/lib/actions/notifications"

async function logEmailToDatabase(
  supabase: any,
  entry: {
    recipient_email: string
    recipient_user_id?: string
    subject: string
    email_type: string
    status: "pending" | "sent" | "failed"
    error_message?: string
  },
) {
  try {
    await supabase.from("sasaeai_email_logs").insert({
      recipient_email: entry.recipient_email,
      recipient_user_id: entry.recipient_user_id || null,
      subject: entry.subject,
      email_type: entry.email_type,
      status: entry.status,
      error_message: entry.error_message || null,
      sent_at: entry.status === "sent" ? new Date().toISOString() : null,
    })
  } catch (err) {
    console.error("Failed to log email:", err)
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from(TABLES.PROFILES)
    .select("is_admin, email")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || !profile.is_admin) {
    console.error("Admin check failed:", profileError)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: targetProfile, error: fetchError } = await supabase
    .from(TABLES.PROFILES)
    .select("id, nickname, email, is_verified")
    .eq("id", params.id)
    .single()

  if (fetchError) {
    console.error("Failed to fetch target profile:", fetchError)
    return NextResponse.json({ error: `ユーザーが見つかりません: ${fetchError.message}` }, { status: 404 })
  }

  const { data: updateData, error } = await supabase
    .from(TABLES.PROFILES)
    .update({ is_verified: true })
    .eq("id", params.id)
    .select()

  if (error) {
    console.error("Verification approval error:", error)
    return NextResponse.json({ error: error.message || "Approval failed" }, { status: 500 })
  }

  if (!updateData || updateData.length === 0) {
    console.error("Update returned no data - possible RLS policy blocking update")
    return NextResponse.json({ error: "更新に失敗しました（RLSポリシーを確認してください）" }, { status: 500 })
  }

  await notifyUserVerificationApproved(params.id)

  const emailSubject = "【ささえ愛】本人確認が承認されました"
  let emailStatus: "sent" | "failed" = "sent"
  let emailError: string | undefined

  try {
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: {
          email: "noreply@sasaeai.help",
          name: "ささえ愛",
        },
        to: [
          {
            email: targetProfile.email,
            name: targetProfile.nickname,
          },
        ],
        subject: emailSubject,
        html: `
          <h2>${targetProfile.nickname}さん</h2>
          <p>本人確認書類の審査が完了し、承認されました。</p>
          <p>これで、お相手の検索やマッチング機能がご利用いただけます。</p>
          <p><a href="https://sasaeai.help/search" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">今すぐお相手を探す</a></p>
          <p style="margin-top: 24px; color: #666;">素敵な出会いがありますように。</p>
          <p style="color: #666;">ささえ愛運営チーム</p>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("MailerSend API error:", response.status, errorData)
      emailStatus = "failed"
      emailError = `MailerSend error: ${response.status}`
    }
  } catch (err: any) {
    console.error("Failed to send approval email:", err.message)
    emailStatus = "failed"
    emailError = err.message
  }

  // メール送信ログを記録
  await logEmailToDatabase(supabase, {
    recipient_email: targetProfile.email,
    recipient_user_id: targetProfile.id,
    subject: emailSubject,
    email_type: "verification_approved",
    status: emailStatus,
    error_message: emailError,
  })

  return NextResponse.json({ success: true })
}
