import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Ban, Clock, UserX } from "lucide-react"
import { getActiveSuspensions } from "@/lib/actions/suspensions"
import { SuspensionsList } from "@/components/admin/suspensions-list"

export default async function SuspensionsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // 管理者チェック
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/")
  }

  const suspensions = await getActiveSuspensions()

  const temporarySuspensions = suspensions.filter((s) => s.type === "temporary")
  const permanentSuspensions = suspensions.filter((s) => s.type === "permanent")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">停止中ユーザー管理</h1>
        <p className="text-muted-foreground">一時停止・永久BANされたユーザーを管理します</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">一時停止中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{temporarySuspensions.length}人</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">永久BAN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{permanentSuspensions.length}人</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">合計</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-gray-500" />
              <span className="text-2xl font-bold">{suspensions.length}人</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>停止中ユーザー一覧</CardTitle>
          <CardDescription>現在アカウントが停止されているユーザーの一覧です</CardDescription>
        </CardHeader>
        <CardContent>
          <SuspensionsList suspensions={suspensions} />
        </CardContent>
      </Card>
    </div>
  )
}
