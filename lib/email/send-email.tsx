"use server"

// メール送信とHTML生成のユーティリティ
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  // MailerSend APIを使用
  const apiKey = process.env.MAILERSEND_API_KEY
  if (!apiKey) {
    console.error("MAILERSEND_API_KEY is not set")
    return { success: false, error: "メール設定がありません" }
  }

  try {
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: "noreply@sasaeai.help",
          name: "ささえ愛",
        },
        to: [{ email: to }],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("MailerSend error:", errorText)
      return { success: false, error: "メール送信に失敗しました" }
    }

    return { success: true }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error: "メール送信中にエラーが発生しました" }
  }
}

// メールHTMLを生成
export async function generateEmailHtml({
  title,
  content,
  buttonText,
  buttonUrl,
}: {
  title: string
  content: string
  buttonText?: string
  buttonUrl?: string
}) {
  const buttonHtml =
    buttonText && buttonUrl
      ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${buttonUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        ${buttonText}
      </a>
    </div>
  `
      : ""

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">ささえ愛</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
        <div style="color: #4b5563;">
          ${content}
        </div>
        ${buttonHtml}
      </div>
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>このメールは「ささえ愛」から自動送信されています。</p>
        <p>© 2026 ささえ愛 All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}
