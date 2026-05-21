import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 管理者権限チェック
  const isAdmin = user.email === "nurekoinu@xmail.ne.jp" || user.email === "nurekoinu-shop1@yahoo.co.jp"

  if (!isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // 本人確認を承認
  const { error } = await supabase.from(TABLES.PROFILES).update({ is_verified: true }).eq("id", params.id)

  if (error) {
    console.error("[v0] Verification approval error:", error)
    return NextResponse.redirect(new URL("/admin/verification?error=approval_failed", request.url))
  }

  return NextResponse.redirect(new URL("/admin/verification?success=approved", request.url))
}
