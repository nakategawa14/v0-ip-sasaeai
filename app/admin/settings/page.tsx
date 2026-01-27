import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { getAdminNotificationSettings } from "@/lib/actions/admin-notifications"
import { AdminNotificationSettingsForm } from "@/components/admin/admin-notification-settings-form"

export default async function AdminSettingsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from(TABLES.PROFILES)
    .select("is_admin, nickname, email")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) redirect("/dashboard")

  const settings = await getAdminNotificationSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">管理者設定</h1>
        <p className="text-muted-foreground">通知の受け取り方を設定します</p>
      </div>

      <AdminNotificationSettingsForm initialSettings={settings} adminEmail={profile.email} />
    </div>
  )
}
