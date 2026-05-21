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
    const { subscription } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "無効な購読情報です" }, { status: 400 })
    }

    // 既存の購読を確認
    const { data: existing } = await supabase
      .from("sasaeai_push_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("endpoint", subscription.endpoint)
      .single()

    if (existing) {
      // 既に登録済み
      return NextResponse.json({ success: true, message: "既に登録されています" })
    }

    // 新規購読を登録
    const { error } = await supabase.from("sasaeai_push_subscriptions").insert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })

    if (error) {
      console.error("購読登録エラー:", error)
      return NextResponse.json({ error: "購読の登録に失敗しました" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("購読登録エラー:", error)
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 })
  }
}
