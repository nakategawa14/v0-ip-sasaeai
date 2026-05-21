import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { Resend } from "resend"

function getImageReminderEmailHtml(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e11d48; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; background: #e11d48; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ささえ愛</h1>
          </div>
          <div class="content">
            <p>${userName}様</p>
            <p>プロフィール画像が未登録です。画像を登録するとマッチング率が大幅に向上します。</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sasaeai.help"}/profile/edit" class="button">プロフィール画像を登録する</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

function getFootprintEmailHtml(userName: string, count: number): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e11d48; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; background: #e11d48; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ささえ愛</h1>
          </div>
          <div class="content">
            <p>${userName}様</p>
            <p>新しい足あとが${count}件あります。あなたのプロフィールに興味を持っている方がいます。</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sasaeai.help"}/dashboard" class="button">足あとを確認する</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

function getCustomEmailHtml(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e11d48; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ささえ愛</h1>
          </div>
          <div class="content">
            ${content}
          </div>
        </div>
      </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      console.error("[v0] RESEND_API_KEY環境変数が設定されていません")
      return NextResponse.json({ error: "Resend APIキーが設定されていません" }, { status: 500 })
    }

    const resend = new Resend(apiKey)

    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // 管理者チェック
    const { data: profile } = await supabase.from("sasaeai_profiles").select("role").eq("user_id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 })
    }

    const body = await request.json()
    const { emailType, genderFilter, subject, content } = body

    console.log("[v0] メール送信リクエスト:", { emailType, genderFilter })

    let recipients: string[] = []
    let emailSubject = ""
    let emailHtml = ""

    let query = supabase
      .from("sasaeai_profiles")
      .select("user_id, nickname, gender, profile_image_1, profile_image_2, profile_image_3")
      .eq("is_active", true)

    if (genderFilter && genderFilter !== "all") {
      query = query.eq("gender", genderFilter)
    }

    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      console.error("[v0] プロフィール取得エラー:", profilesError)
      return NextResponse.json({ error: "ユーザー取得に失敗しました" }, { status: 500 })
    }

    console.log("[v0] 取得したプロフィール:", profiles?.length)

    const userIds = profiles?.map((p: any) => p.user_id) || []
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error("[v0] ユーザー取得エラー:", usersError)
      return NextResponse.json({ error: "ユーザー情報取得に失敗しました" }, { status: 500 })
    }

    const emailMap = new Map(users.users.map((u) => [u.id, u.email]))

    // メールタイプごとの処理
    if (emailType === "profile_image_reminder" || emailType === "image-reminder") {
      // 画像未登録ユーザーをフィルター
      const usersWithoutImage = profiles?.filter(
        (p: any) => !p.profile_image_1 && !p.profile_image_2 && !p.profile_image_3,
      )

      recipients =
        usersWithoutImage
          ?.map((p: any) => emailMap.get(p.user_id))
          .filter((email): email is string => email !== undefined) || []
      emailSubject = "プロフィール画像の登録をお願いします - ささえ愛"
      emailHtml = getImageReminderEmailHtml("会員")
    } else if (emailType === "new_visitor_notification" || emailType === "footprint") {
      // 全ユーザー向け（簡易実装）
      recipients =
        profiles?.map((p: any) => emailMap.get(p.user_id)).filter((email): email is string => email !== undefined) || []
      emailSubject = "新しい足あとがあります - ささえ愛"
      emailHtml = getFootprintEmailHtml("会員", 1)
    } else if (emailType === "broadcast" || emailType === "all-users") {
      // 全ユーザー向け
      recipients =
        profiles?.map((p: any) => emailMap.get(p.user_id)).filter((email): email is string => email !== undefined) || []
      emailSubject = subject || "ささえ愛からのお知らせ"
      emailHtml = getCustomEmailHtml(content || "")
    }

    console.log("[v0] 送信対象:", recipients.length)

    if (recipients.length === 0) {
      return NextResponse.json({ error: "送信対象ユーザーがいません" }, { status: 400 })
    }

    // メール一斉送信
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const recipient of recipients) {
      try {
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: recipient,
          subject: emailSubject,
          html: emailHtml,
        })
        results.success++
        console.log("[v0] メール送信成功:", recipient)
      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : "不明なエラー"
        results.errors.push(`${recipient}: ${errorMessage}`)
        console.error("[v0] メール送信失敗:", recipient, error)
      }
    }

    console.log("[v0] 送信結果:", results)

    // ログを保存
    await supabase.from("sasaeai_email_logs").insert({
      email_type: emailType,
      recipient_count: recipients.length,
      success_count: results.success,
      failed_count: results.failed,
      subject: emailSubject,
      content: emailType === "all-users" || emailType === "broadcast" ? content : null,
      sent_by: user.id,
    })

    return NextResponse.json({
      success: true,
      recipientCount: recipients.length,
      successCount: results.success,
      failedCount: results.failed,
      errors: results.errors,
    })
  } catch (error) {
    console.error("[v0] メール送信エラー:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "メール送信に失敗しました" },
      { status: 500 },
    )
  }
}
