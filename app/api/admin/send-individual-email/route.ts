import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { TABLE_NAMES } from "@/lib/supabase/table-names"

export async function POST(request: Request) {
  console.log("[v0 API] 🟢 POST /api/admin/send-individual-email called")

  try {
    const supabase = await createServerClient()

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0 API] ❌ Authentication failed")
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // 管理者チェック
    const { data: profile } = await supabase.from(TABLE_NAMES.PROFILES).select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      console.log("[v0 API] ❌ User is not admin")
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, emailType } = body

    console.log("[v0 API] 📧 Individual email params:", { userId, emailType })

    if (!userId || !emailType) {
      return NextResponse.json({ error: "必要なパラメータが不足しています" }, { status: 400 })
    }

    // 対象ユーザーを取得
    const { data: targetUser, error: userError } = await supabase
      .from(TABLE_NAMES.PROFILES)
      .select("id, email, nickname")
      .eq("id", userId)
      .single()

    if (userError || !targetUser) {
      console.error("[v0 API] ❌ Error fetching user:", userError)
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 })
    }

    console.log(`[v0 API] 📬 Target user:`, targetUser)

    let subject = ""
    let emailBody = ""

    if (emailType === "license_reminder") {
      subject = "【ささえ愛】免許証の登録をお願いします"
      emailBody = `
        <p>こんにちは、${targetUser.nickname}さん。</p>
        <p>安心・安全なマッチングのため、免許証の登録をお願いします。</p>
        <p>本人確認が完了すると、信頼度が向上し、マッチング率がアップします。</p>
        <p><a href="https://sasaeai.help/profile/edit">免許証を登録する</a></p>
      `
    } else if (emailType === "selfie_reminder") {
      subject = "【ささえ愛】自撮り写真の登録をお願いします"
      emailBody = `
        <p>こんにちは、${targetUser.nickname}さん。</p>
        <p>自撮り写真を登録すると、あなたの魅力がより伝わります。</p>
        <p>本人確認にも役立ち、マッチング率が大幅にアップします。</p>
        <p><a href="https://sasaeai.help/profile/edit">自撮り写真を登録する</a></p>
      `
    } else {
      return NextResponse.json({ error: "無効なメールタイプです" }, { status: 400 })
    }

    // MailerSend APIキー確認
    const mailersendApiKey = process.env.MAILERSEND_API_KEY

    if (!mailersendApiKey) {
      console.log("[v0 API] ❌ MAILERSEND_API_KEY not found")
      return NextResponse.json({ error: "MailerSend APIキーが設定されていません" }, { status: 500 })
    }

    const TEST_MODE = true
    const TEST_EMAIL = "tobiuotsukai@yahoo.co.jp"
    const recipientEmail = TEST_MODE ? TEST_EMAIL : targetUser.email

    console.log(`[v0 API] 📤 Sending email to: ${recipientEmail} (original: ${targetUser.email})`)

    try {
      const response = await fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mailersendApiKey}`,
        },
        body: JSON.stringify({
          from: {
            email: TEST_MODE ? "info@test-p7kx4xwqv58g9yjr.mlsender.net" : "noreply@sasaeai.help",
            name: "ささえ愛",
          },
          to: [
            {
              email: recipientEmail,
              name: targetUser.nickname || targetUser.email,
            },
          ],
          subject: subject,
          html: emailBody,
        }),
      })

      let responseData: any = null
      const contentType = response.headers.get("content-type")

      if (contentType?.includes("application/json")) {
        responseData = await response.json()
      } else {
        const textResponse = await response.text()
        console.log(`[v0 API] ⚠️ Non-JSON response:`, textResponse)
        responseData = { message: textResponse }
      }

      console.log(`[v0 API] 📬 MailerSend API response:`, {
        status: response.status,
        data: responseData,
      })

      if (response.ok) {
        // email_logsに記録
        await supabase.from(TABLE_NAMES.EMAIL_LOGS).insert({
          user_id: targetUser.id,
          email_type: emailType,
          subject: subject,
          status: "sent",
          sent_at: new Date().toISOString(),
        })

        console.log("[v0 API] ✅ Individual email sent successfully")
        return NextResponse.json({
          success: true,
          message: "メールを送信しました",
        })
      } else {
        // email_logsに失敗を記録
        await supabase.from(TABLE_NAMES.EMAIL_LOGS).insert({
          user_id: targetUser.id,
          email_type: emailType,
          subject: subject,
          status: "failed",
          error_message: JSON.stringify(responseData),
          sent_at: new Date().toISOString(),
        })

        return NextResponse.json(
          {
            error: "メール送信に失敗しました",
            details: responseData.message || "Unknown error",
          },
          { status: 500 },
        )
      }
    } catch (error) {
      console.error(`[v0 API] ❌ Error sending email:`, error)

      // email_logsに失敗を記録
      await supabase.from(TABLE_NAMES.EMAIL_LOGS).insert({
        user_id: targetUser.id,
        email_type: emailType,
        subject: subject,
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        sent_at: new Date().toISOString(),
      })

      return NextResponse.json(
        {
          error: "メール送信中にエラーが発生しました",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0 API] ❌ Unexpected error:", error)
    return NextResponse.json(
      {
        error: "メール送信中にエラーが発生しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
