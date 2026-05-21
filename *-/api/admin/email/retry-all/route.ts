import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { retryAllFailedEmails } from "@/lib/email/email-logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // 管理者チェック
    const { data: profile } = await supabase.from("sasaeai_profiles").select("is_admin").eq("user_id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 })
    }

    const results = await retryAllFailedEmails()

    return NextResponse.json({
      success: true,
      message: `${results.total}件中${results.success}件の送信に成功しました`,
      ...results,
    })
  } catch (error) {
    console.error("Email retry-all error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "一括リトライに失敗しました" },
      { status: 500 },
    )
  }
}
