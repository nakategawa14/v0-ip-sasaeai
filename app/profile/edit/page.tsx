import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ProfileEditForm } from "@/components/profile/profile-edit-form"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TABLES } from "@/lib/supabase/table-names"

export default async function ProfileEditPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from(TABLES.PROFILES)
    .select("*")
    .eq("email", user.email)
    .single()

  console.log("[v0] Profile edit - Profile data:", profile)
  console.log("[v0] Profile edit - Profile error:", profileError)

  if (!profile) {
    redirect("/profile/setup")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">プロフィール編集</h1>
          <p className="text-gray-600">あなたの情報を更新してください</p>
        </div>
        <ProfileEditForm profile={profile} />
      </main>
    </div>
  )
}
