import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search } from "lucide-react"
import { TABLES } from "@/lib/supabase/table-names"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { search?: string; filter?: string }
}) {
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

  // ユーザー検索
  let query = supabase.from(TABLES.PROFILES).select("*").order("created_at", { ascending: false })

  if (searchParams.search) {
    query = query.or(`nickname.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%`)
  }

  if (searchParams.filter === "premium") {
    query = query.eq("is_premium", true)
  } else if (searchParams.filter === "free") {
    query = query.eq("is_premium", false)
  } else if (searchParams.filter === "inactive") {
    query = query.eq("is_active", false)
  }

  const { data: users } = await query.limit(50)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ユーザー管理</h1>
          <p className="text-gray-600">全ユーザーの管理と監視</p>
        </div>

        <Card className="mb-6 p-4">
          <form className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                name="search"
                placeholder="名前またはメールアドレスで検索..."
                className="pl-10"
                defaultValue={searchParams.search}
              />
            </div>
            <Button type="submit">検索</Button>
          </form>
          <div className="mt-4 flex gap-2">
            <Link href="/admin/users">
              <Badge variant={!searchParams.filter ? "default" : "outline"}>全て</Badge>
            </Link>
            <Link href="/admin/users?filter=premium">
              <Badge variant={searchParams.filter === "premium" ? "default" : "outline"}>有料会員</Badge>
            </Link>
            <Link href="/admin/users?filter=free">
              <Badge variant={searchParams.filter === "free" ? "default" : "outline"}>無料会員</Badge>
            </Link>
            <Link href="/admin/users?filter=inactive">
              <Badge variant={searchParams.filter === "inactive" ? "default" : "outline"}>停止中</Badge>
            </Link>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ユーザー</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ステータス</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">登録日</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">最終アクティブ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users?.map((targetUser) => (
                  <tr key={targetUser.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{targetUser.nickname}</p>
                        <p className="text-sm text-gray-600">{targetUser.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Badge variant={targetUser.is_premium ? "default" : "secondary"}>
                          {targetUser.is_premium ? "有料" : "無料"}
                        </Badge>
                        {!targetUser.is_active && <Badge variant="destructive">停止中</Badge>}
                        {targetUser.is_verified && (
                          <Badge variant="outline" className="bg-green-50">
                            認証済み
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(targetUser.created_at).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(targetUser.updated_at).toLocaleDateString("ja-JP")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${targetUser.id}`}>
                        <Button variant="outline" size="sm">
                          詳細
                        </Button>
                      </Link>
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
