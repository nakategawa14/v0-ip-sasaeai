import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { TABLES } from "@/lib/supabase/table-names"
import { BlockedUsersList } from "@/components/blocks/blocked-users-list"

export default async function BlocksPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("user_id", user.id).single()

  if (!profile) {
    redirect("/dashboard")
  }

  // ブロックしたユーザー一覧を取得
  const { data: blocks } = await supabase
    .from(TABLES.BLOCKS)
    .select(
      `
      id,
      blocked_id,
      created_at,
      blocked_profile:sasaeai_profiles!sasaeai_blocks_blocked_id_fkey(
        user_id,
        nickname,
        profile_images,
        prefecture,
        city
      )
    `,
    )
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ブロックリスト</h1>
          <p className="text-gray-600">ブロックしたユーザーの管理</p>
        </div>

        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{blocks?.length || 0}</p>
              <p className="text-sm text-gray-600">ブロック中のユーザー</p>
            </div>
          </div>
        </Card>

        <BlockedUsersList blocks={blocks || []} />
      </main>
    </div>
  )
}
