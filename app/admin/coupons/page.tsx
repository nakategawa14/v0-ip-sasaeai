import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TABLES } from "@/lib/supabase/table-names"

export default async function AdminCouponsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 管理者権限チェック（実装例）
  // TODO: 管理者権限の実装

  // クーポンコードを取得
  const { data: coupons } = await supabase
    .from(TABLES.COUPON_CODES)
    .select("*")
    .order("created_at", { ascending: false })
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/profile/setup")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">クーポンコード管理</h1>
            <p className="text-gray-600">クーポンコードの作成と管理</p>
          </div>
          <Link href="/admin/coupons/create">
            <Button>新規作成</Button>
          </Link>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">コード</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">割引</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">使用状況</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">有効期限</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ステータス</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons?.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">{coupon.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : `¥${coupon.discount_value}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {coupon.current_uses} / {coupon.max_uses || "無制限"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString("ja-JP") : "無期限"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={coupon.is_active ? "default" : "secondary"}>
                        {coupon.is_active ? "有効" : "無効"}
                      </Badge>
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
