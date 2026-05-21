import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ContactMessagesList } from "@/components/admin/contact-messages-list"
import { TABLES } from "@/lib/supabase/table-names"

export default async function AdminContactPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  if (!profile || !["admin", "moderator"].includes(profile.user_type)) {
    redirect("/dashboard")
  }

  let query = supabase
    .from("contact_messages")
    .select(
      `
      *,
      user:user_id(id, display_name, email)
    `,
    )
    .order("created_at", { ascending: false })

  if (searchParams.status) {
    query = query.eq("status", searchParams.status)
  }

  const { data: messages } = await query

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">問い合わせ管理</h1>
          <p className="text-gray-600">ユーザーからの問い合わせを確認・返信</p>
        </div>

        <ContactMessagesList messages={messages || []} currentStatus={searchParams.status} />
      </main>
    </div>
  )
}
