import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ContactMessageReply } from "@/components/admin/contact-message-reply"
import { TABLES } from "@/lib/supabase/table-names"

export default async function AdminContactDetailPage({ params }: { params: { id: string } }) {
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

  const { data: message } = await supabase
    .from("contact_messages")
    .select(
      `
      *,
      user:user_id(id, display_name, email)
    `,
    )
    .eq("id", params.id)
    .single()

  if (!message) {
    redirect("/admin/contact")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <ContactMessageReply message={message} />
      </main>
    </div>
  )
}
