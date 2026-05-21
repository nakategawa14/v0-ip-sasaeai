import { createServerSupabaseClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: "エンドポイントが必要です" }, { status: 400 })
    }

    // 購読を削除
    const { error } = await supabase
      .from("sasaeai_push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint)

    if (error) {
      console.error("購読削除エラー:", error)
      return NextResponse.json({ error: "購読の削除に失敗しました" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("購読削除エラー:", error)
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 })
  }
}
