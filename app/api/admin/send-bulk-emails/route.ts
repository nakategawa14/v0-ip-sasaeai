import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { TABLE_NAMES } from "@/lib/supabase/table-names"

export async function POST(request: Request) {
  console.log("[v0 API] 🟢 POST /api/admin/send-bulk-emails called")

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
    const { emailType, targetGender } = body

    console.log("[v0 API] 📧 Email params:", { emailType, targetGender })

    if (!emailType || !targetGender) {
      return NextResponse.json({ error: "必要なパラメータが不足しています" }, { status: 400 })
    }

    let targetUsersQuery = supabase
      .from(TABLE_NAMES.PROFILES)
      .select(
        "id, email, nickname, gender, profile_image_url, id_verification_image_url, selfie_verification_image_url, created_at",
      )

    if (emailType !== "broadcast" && targetGender !== "all") {
      targetUsersQuery = targetUsersQuery.eq("gender", targetGender)
      console.log(`[v0 API] 📊 Applying gender filter: ${targetGender}`)
    }

    // emailTypeに応じたフィルター
    if (emailType === "profile_image_reminder") {
      // 24時間以上経過、画像未登録のユーザー
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      console.log(`[v0 API] 🔍 Filtering: profile_image_url IS NULL AND created_at < ${yesterday.toISOString()}`)
      targetUsersQuery = targetUsersQuery.is("profile_image_url", null).lt("created_at", yesterday.toISOString())
    } else if (emailType === "license_reminder") {
      console.log(`[v0 API] 🔍 Filtering: id_verification_image_url IS NULL`)
      targetUsersQuery = targetUsersQuery.is("id_verification_image_url", null)
    } else if (emailType === "selfie_reminder") {
      console.log(`[v0 API] 🔍 Filtering: selfie_verification_image_url IS NULL`)
      targetUsersQuery = targetUsersQuery.is("selfie_verification_image_url", null)
    } else if (emailType === "new_visitor_notification") {
      // 足あとがあるユーザー（簡易実装）
      // 実際には profile_views テーブルと結合が必要
      console.log(`[v0 API] 🔍 new_visitor_notification: Not yet implemented`)
    } else if (emailType === "broadcast") {
      console.log(`[v0 API] 📢 Broadcast mode: Sending to all users`)
    }

    const { data: targetUsers, error: usersError } = await targetUsersQuery

    console.log(`[v0 API] 📬 Query result: ${targetUsers?.length || 0} users`)

    if (usersError) {
      console.error("[v0 API] ❌ Error fetching users:", usersError)
      return NextResponse.json({ error: "ユーザー取得エラー" }, { status: 500 })
    }

    if (!targetUsers || targetUsers.length === 0) {
      console.log("[v0 API] ⚠️ No target users found with the specified criteria")
      return NextResponse.json({ error: "送信対象のユーザーが見つかりません" }, { status: 400 })
    }

    console.log(`[v0 API] 📬 Target users count: ${targetUsers.length}`)
    console.log(`[v0 API] 📬 Sample user:`, targetUsers[0])

    let subject = ""
    let emailBody = ""

    if (emailType === "profile_image_reminder") {
      subject = "【ささえ愛】プロフィール画像を登録しましょう"
      emailBody = `
        <p>こんにちは、ささえ愛です。</p>
        <p>プロフィール画像を登録すると、マッチング率が大幅にアップします。</p>
        <p>ぜひプロフィール画像を登録してください。</p>
        <p><a href="https://sasaeai.help/profile/edit">プロフィール編集ページへ</a></p>
      `
    } else if (emailType === "license_reminder") {
      subject = "【ささえ愛】免許証の登録をお願いします"
      emailBody = `
        <p>こんにちは、ささえ愛です。</p>
        <p>安心・安全なマッチングのため、免許証の登録をお願いします。</p>
        <p>本人確認が完了すると、信頼度が向上し、マッチング率がアップします。</p>
        <p><a href="https://sasaeai.help/profile/edit">免許証を登録する</a></p>
      `
    } else if (emailType === "selfie_reminder") {
      subject = "【ささえ愛】自撮り写真の登録をお願いします"
      emailBody = `
        <p>こんにちは、ささえ愛です。</p>
        <p>自撮り写真を登録すると、あなたの魅力がより伝わります。</p>
        <p>本人確認にも役立ち、マッチング率が大幅にアップします。</p>
        <p><a href="https://sasaeai.help/profile/edit">自撮り写真を登録する</a></p>
      `
    } else if (emailType === "new_visitor_notification") {
      subject = "【ささえ愛】新しい足あとがあります"
      emailBody = `
        <p>こんにちは、ささえ愛です。</p>
        <p>あなたのプロフィールに新しい足あとがあります。</p>
        <p>ぜひチェックしてみてください。</p>
        <p><a href="https://sasaeai.help/dashboard">ダッシュボードへ</a></p>
      `
    } else if (emailType === "broadcast") {
      subject = "【ささえ愛】お知らせ"
      emailBody = `
        <p>こんにちは、ささえ愛です。</p>
        <p>重要なお知らせです。</p>
        <p><a href="https://sasaeai.help">ささえ愛へ</a></p>
      `
    } else {
      subject = "【ささえ愛】お知らせ"
      emailBody = `
        <p>こんにちは、ささえ愛です。</p>
        <p>重要なお知らせです。</p>
        <p><a href="https://sasaeai.help">ささえ愛へ</a></p>
      `
    }

    // MailerSend APIキー確認
    const mailersendApiKey = process.env.MAILERSEND_API_KEY
    console.log("[v0 API] 🔑 MAILERSEND_API_KEY exists:", !!mailersendApiKey)
    console.log("[v0 API] 🔑 MAILERSEND_API_KEY length:", mailersendApiKey?.length || 0)
    console.log("[v0 API] 🔑 MAILERSEND_API_KEY prefix:", mailersendApiKey?.substring(0, 8))

    if (!mailersendApiKey) {
      console.log("[v0 API] ❌ MAILERSEND_API_KEY not found")
      return NextResponse.json({ error: "MailerSend APIキーが設定されていません" }, { status: 500 })
    }

    const TEST_MODE = true
    const TEST_EMAIL = "tobiuotsukai@yahoo.co.jp"
    console.log("[v0 API] 🧪 TEST_MODE enabled: All emails will be sent to", TEST_EMAIL)

    const results = []
    let successCount = 0
    let failureCount = 0

    // 各ユーザーにメール送信
    for (const targetUser of targetUsers) {
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
          console.log(`[v0 API] ⚠️ Non-JSON response for ${recipientEmail}:`, textResponse)
          responseData = { message: textResponse }
        }

        console.log(`[v0 API] 📬 MailerSend API response for ${recipientEmail}:`, {
          status: response.status,
          data: responseData,
        })

        if (response.ok) {
          successCount++

          await supabase.from(TABLE_NAMES.EMAIL_LOGS).insert({
            user_id: targetUser.id,
            email_type: emailType,
            subject: subject,
            status: "sent",
            sent_at: new Date().toISOString(),
          })

          results.push({
            email: targetUser.email,
            status: "success",
            message: "送信成功",
          })
        } else {
          failureCount++

          await supabase.from(TABLE_NAMES.EMAIL_LOGS).insert({
            user_id: targetUser.id,
            email_type: emailType,
            subject: subject,
            status: "failed",
            error_message: JSON.stringify(responseData),
            sent_at: new Date().toISOString(),
          })

          results.push({
            email: targetUser.email,
            status: "error",
            message: responseData.message || "送信失敗",
          })
        }
      } catch (error) {
        console.error(`[v0 API] ❌ Error sending to ${targetUser.email}:`, error)
        failureCount++

        await supabase.from(TABLE_NAMES.EMAIL_LOGS).insert({
          user_id: targetUser.id,
          email_type: emailType,
          subject: subject,
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          sent_at: new Date().toISOString(),
        })

        results.push({
          email: targetUser.email,
          status: "error",
          message: error instanceof Error ? error.message : "送信エラー",
        })
      }

      // レート制限対策: 1.5秒待機
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    console.log("[v0 API] ✅ Bulk email send complete:", { successCount, failureCount })

    return NextResponse.json({
      success: true,
      message: `メール送信完了: 成功 ${successCount}件、失敗 ${failureCount}件`,
      results,
    })
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
