import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { TABLES } from "@/lib/supabase/table-names"
import VerificationCard from "@/components/VerificationCard"

export default async function AdminVerificationPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!profile || !profile.is_admin) {
    redirect("/dashboard")
  }

  const { data: pendingUsers } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .eq("is_verified", false)
    .or("id_verification_image_url.not.is.null,selfie_verification_image_url.not.is.null")
    .order("updated_at", { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">本人確認管理</h1>
        <p className="text-gray-600">年齢確認書類の審査と承認</p>
        <p className="mt-2 text-sm text-orange-600">
          ※ 年齢確認は法律で義務付けられています。免許証などの公的書類で18歳以上であることを確認してください。
        </p>
      </div>

      {pendingUsers && pendingUsers.length > 0 ? (
        <div className="space-y-4">
          {pendingUsers.map((targetUser) => (
            <VerificationCard key={targetUser.id} user={targetUser} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-gray-500">現在、本人確認待ちのユーザーはいません</p>
        </Card>
      )}
    </div>
  )
}
