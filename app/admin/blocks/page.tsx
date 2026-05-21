import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { TABLES } from "@/lib/supabase/table-names"

export default async function AdminBlocksPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  if (!profile || !profile.is_admin) {
    redirect("/dashboard")
  }

  // すべてのブロック関係を取得
  const { data: blocks } = await supabase
    .from(TABLES.BLOCKS)
    .select(
      `
      *,
      blocker:blocker_id(nickname, email),
      blocked:blocked_id(nickname, email)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ブロック管理</h1>
          <p className="text-gray-600">全ブロック関係の管理と監視</p>
        </div>

        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{blocks?.length || 0}</p>
              <p className="text-sm text-gray-600">総ブロック数</p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ブロックしたユーザー</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ブロックされたユーザー</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ブロック日時</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {blocks?.map((block: any) => (
                  <tr key={block.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{block.blocker?.nickname || "不明"}</p>
                        <p className="text-sm text-gray-600">{block.blocker?.email || "不明"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{block.blocked?.nickname || "不明"}</p>
                        <p className="text-sm text-gray-600">{block.blocked?.email || "不明"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(block.created_at).toLocaleString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
