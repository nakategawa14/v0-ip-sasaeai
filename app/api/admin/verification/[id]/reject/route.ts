import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { notifyUserVerificationRejected } from "@/lib/actions/notifications"

async function logEmailToDatabase(
  supabase: any,
  entry: {
    recipient_email: string
    recipient_user_id?: string
    subject: string
    email_type: string
    status: "pending" | "sent" | "failed"
    error_message?: string
    metadata?: Record<string, unknown>
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
      metadata: entry.metadata || {},
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

  const { error } = await supabase
    .from(TABLES.PROFILES)
    .update({
      is_verified: false,
      id_verification_image_url: null,
      selfie_verification_image_url: null,
    })
    .eq("id", params.id)

  if (error) {
    console.error("Verification rejection error:", error)
    return NextResponse.json({ error: error.message || "Rejection failed" }, { status: 500 })
  }

  const body = await request.json()
  const rejectionReason = body.reason || "承認できませんでした"

  await notifyUserVerificationRejected(params.id, rejectionReason)

  const emailSubject = "【ささえ愛】本人確認書類の再提出をお願いします"
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
          <p>提出いただいた本人確認書類を審査した結果、以下の理由により承認できませんでした。</p>
          <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #991B1B; font-weight: 500;">却下理由:</p>
            <p style="margin: 8px 0 0 0; color: #7F1D1D;">${rejectionReason}</p>
          </div>
          <p>お手数ですが、以下の点にご注意の上、再度本人確認書類をご提出ください。</p>
          <ul style="margin: 16px 0; padding-left: 24px;">
            <li>生年月日と顔写真がはっきり見える</li>
            <li>明るい場所で撮影する</li>
            <li>書類全体が枠内に入っている</li>
            <li>自撮り画像は本人確認書類の顔写真と同じ人物であることが分かるように撮影する</li>
          </ul>
          <p><a href="https://sasaeai.help/profile/edit" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">本人確認書類を再提出する</a></p>
          <p style="margin-top: 24px; color: #666;">ご不明な点がございましたら、お気軽にお問い合わせください。</p>
          <p style="color: #666;">ささえ愛運営チーム</p>
        `,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("MailerSend API error:", errorData)
      emailStatus = "failed"
      emailError = `MailerSend error: ${response.status}`
    }
  } catch (err: any) {
    console.error("Failed to send rejection email:", err)
    emailStatus = "failed"
    emailError = err.message
  }

  // メール送信ログを記録（却下理由をメタデータに保存）
  await logEmailToDatabase(supabase, {
    recipient_email: targetProfile.email,
    recipient_user_id: targetProfile.id,
    subject: emailSubject,
    email_type: "verification_rejected",
    status: emailStatus,
    error_message: emailError,
    metadata: { rejection_reason: rejectionReason },
  })

  return NextResponse.json({ success: true })
}
