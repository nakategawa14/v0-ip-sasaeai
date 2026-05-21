import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { redirect } from "next/navigation"
import { CreateRoomForm } from "@/components/group-chat/create-room-form"

export default async function CreateGroupChatPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // プロフィール確認
  const { data: profile } = await supabase
    .from(TABLES.PROFILES)
    .select("gender, membership_status, nickname, is_admin")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/profile/create")
  }

  // 女性、有料男性、または管理者がルーム作成可能
  const canCreate = profile.gender === "female" || profile.membership_status === "paid" || profile.is_admin

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">ライブチャット枠を作成</h1>

      {canCreate ? (
        <Suspense fallback={<div>読み込み中...</div>}>
          <CreateRoomForm />
        </Suspense>
      ) : (
        <div className="rounded-lg border bg-card p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">有料プランが必要です</h2>
          <p className="text-muted-foreground mb-6">
            ライブチャット枠の作成は、女性会員または有料男性会員のみご利用いただけます。
          </p>
        </div>
      )}
    </div>
  )
}
