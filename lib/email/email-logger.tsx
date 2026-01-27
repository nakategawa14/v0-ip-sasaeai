import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

export interface EmailLogEntry {
  recipient_email: string
  recipient_user_id?: string
  subject: string
  email_type: string
  status: "pending" | "sent" | "failed" | "retrying"
  error_message?: string
  metadata?: Record<string, unknown>
  html_content?: string
}

export async function logEmail(entry: EmailLogEntry): Promise<string | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("sasaeai_email_logs")
      .insert({
        recipient_email: entry.recipient_email,
        recipient_user_id: entry.recipient_user_id || null,
        subject: entry.subject,
        email_type: entry.email_type,
        status: entry.status,
        error_message: entry.error_message || null,
        metadata: entry.metadata || {},
        html_content: entry.html_content || null,
        sent_at: entry.status === "sent" ? new Date().toISOString() : null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to log email:", error)
      return null
    }

    return data?.id || null
  } catch (err) {
    console.error("Error logging email:", err)
    return null
  }
}

export async function updateEmailLog(
  logId: string,
  updates: {
    status?: "pending" | "sent" | "failed" | "retrying"
    error_message?: string
    retry_count?: number
  },
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    if (updates.status === "sent") {
      updateData.sent_at = new Date().toISOString()
    }

    const { error } = await supabase.from("sasaeai_email_logs").update(updateData).eq("id", logId)

    if (error) {
      console.error("Failed to update email log:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Error updating email log:", err)
    return false
  }
}

export async function getFailedEmails(limit = 10): Promise<any[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("sasaeai_email_logs")
      .select("*")
      .eq("status", "failed")
      .lt("retry_count", 3)
      .order("created_at", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Failed to get failed emails:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("Error getting failed emails:", err)
    return []
  }
}

export async function retryEmail(logId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // メールログを取得
    const { data: log, error: fetchError } = await supabase
      .from("sasaeai_email_logs")
      .select("*")
      .eq("id", logId)
      .single()

    if (fetchError || !log) {
      return { success: false, error: "メールログが見つかりません" }
    }

    // リトライ回数チェック
    if (log.retry_count >= 3) {
      return { success: false, error: "リトライ上限（3回）に達しています" }
    }

    // ステータスを「リトライ中」に更新
    await updateEmailLog(logId, { status: "retrying" })

    // Resendでメール送信
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      await updateEmailLog(logId, {
        status: "failed",
        error_message: "RESEND_API_KEY未設定",
        retry_count: log.retry_count + 1,
      })
      return { success: false, error: "RESEND_API_KEY未設定" }
    }

    const resend = new Resend(apiKey)

    // メール送信
    const { error: sendError } = await resend.emails.send({
      from: "ささえ愛 <noreply@sasaeai.help>",
      to: log.recipient_email,
      subject: log.subject,
      html: log.html_content || `<p>${log.subject}</p>`,
    })

    if (sendError) {
      await updateEmailLog(logId, {
        status: "failed",
        error_message: sendError.message,
        retry_count: log.retry_count + 1,
      })
      return { success: false, error: sendError.message }
    }

    // 成功
    await updateEmailLog(logId, {
      status: "sent",
      error_message: undefined,
      retry_count: log.retry_count + 1,
    })

    return { success: true }
  } catch (err) {
    console.error("Error retrying email:", err)
    return { success: false, error: err instanceof Error ? err.message : "不明なエラー" }
  }
}

export async function retryAllFailedEmails(): Promise<{
  total: number
  success: number
  failed: number
  errors: string[]
}> {
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [] as string[],
  }

  try {
    const failedEmails = await getFailedEmails(50)
    results.total = failedEmails.length

    for (const email of failedEmails) {
      const result = await retryEmail(email.id)
      if (result.success) {
        results.success++
      } else {
        results.failed++
        results.errors.push(`${email.recipient_email}: ${result.error}`)
      }

      // レート制限対策：100ms待機
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  } catch (err) {
    console.error("Error in retryAllFailedEmails:", err)
  }

  return results
}
