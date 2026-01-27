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

  // 本人確認画像を削除して却下
  const { error } = await supabase
    .from(TABLES.PROFILES)
    .update({
      id_verification_image_url: null,
      selfie_verification_image_url: null,
      is_verified: false,
    })
    .eq("id", params.id)

  if (error) {
    console.error("[v0] Verification rejection error:", error)
    return NextResponse.redirect(new URL("/admin/verification?error=rejection_failed", request.url))
  }

  return NextResponse.redirect(new URL("/admin/verification?success=rejected", request.url))
}
