import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { CreateCouponForm } from "@/components/admin/create-coupon-form"
import { TABLES } from "@/lib/supabase/table-names"

export default async function CreateCouponPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/profile/setup")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="p-8">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">クーポンコード作成</h1>
          <CreateCouponForm />
        </Card>
      </main>
    </div>
  )
}
