import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { retryEmail } from "@/lib/email/email-logger"

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

    const body = await request.json()
    const { logId } = body

    if (!logId) {
      return NextResponse.json({ error: "ログIDが必要です" }, { status: 400 })
    }

    const result = await retryEmail(logId)

    if (result.success) {
      return NextResponse.json({ success: true, message: "メール送信に成功しました" })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Email retry error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "リトライに失敗しました" },
      { status: 500 },
    )
  }
}
