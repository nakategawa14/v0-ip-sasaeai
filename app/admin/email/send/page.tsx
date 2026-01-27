import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EmailSendForm } from "@/components/admin/email-send-form"

export default async function EmailSendPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("sasaeai_profiles").select("*").eq("id", user.id).single()

  console.log("[v0 Page] User email:", user.email)
  console.log("[v0 Page] Profile data:", profile)
  console.log("[v0 Page] profile.is_admin:", profile?.is_admin)

  if (!profile || !profile.is_admin) {
    console.log("[v0 Page] ❌ Not admin or no profile, redirecting to dashboard")
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">メール送信</h1>
          <p className="text-gray-600">ユーザーへのメール配信</p>
        </div>

        <EmailSendForm />
      </main>
    </div>
  )
}
