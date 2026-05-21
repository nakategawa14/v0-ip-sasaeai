import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { TABLES } from "@/lib/supabase/table-names"

export default async function AdsManagementPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  // 管理者チェック（実際の実装では適切な権限チェックを行う）
  if (!profile || profile.user_type !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">広告管理</h1>
          <p className="text-gray-600">Amazonアソシエイトと楽天ROOMの広告設定</p>
        </div>

        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Amazonアソシエイト</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">アフィリエイトID</label>
                <p className="text-sm text-gray-600">
                  lib/ads/ad-config.ts ファイルの amazon.affiliateId を更新してください
                </p>
              </div>
              <div>
                <a
                  href="https://affiliate.amazon.co.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Button variant="outline">
                    Amazonアソシエイトを開く
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">楽天ROOM</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ROOM ID</label>
                <p className="text-sm text-gray-600">
                  lib/ads/ad-config.ts ファイルの rakuten.roomId を更新してください
                </p>
              </div>
              <div>
                <a href="https://room.rakuten.co.jp/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    楽天ROOMを開く
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">広告表示設定</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">無料会員への広告表示</p>
                  <p className="text-sm text-gray-600">無料会員に広告を表示します</p>
                </div>
                <div className="rounded bg-green-100 px-3 py-1 text-sm font-medium text-green-800">有効</div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">有料会員への広告表示</p>
                  <p className="text-sm text-gray-600">有料会員には広告を表示しません</p>
                </div>
                <div className="rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">無効</div>
              </div>
            </div>
          </Card>

          <Card className="border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-2 font-semibold text-blue-900">収益目標</h3>
            <p className="mb-4 text-sm text-blue-800 leading-relaxed">
              有料会員1,000人 × 500円 = 月50万円の目標
              <br />
              広告収益でサービス維持費をカバーし、格安価格でのサービス提供を実現します
            </p>
          </Card>
        </div>
      </main>
    </div>
  )
}
