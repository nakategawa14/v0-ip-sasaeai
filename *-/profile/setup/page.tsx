import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ProfileSetupForm } from "@/components/profile/profile-setup-form"
import { Heart } from "lucide-react"
import { TABLES } from "@/lib/supabase/table-names"

export default async function ProfileSetupPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 既にプロフィールが作成されているかチェック
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  if (profile && profile.nickname) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 p-4 py-12">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-pink-500" />
          <h1 className="mb-2 text-3xl font-bold text-gray-900">プロフィール作成</h1>
          <p className="text-gray-600">あなたのことを教えてください</p>
        </div>
        <ProfileSetupForm userId={user.id} userEmail={user.email || ""} />
      </div>
    </div>
  )
}
