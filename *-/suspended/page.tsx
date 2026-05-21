import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ban, Clock, Mail } from "lucide-react"
import Link from "next/link"

export default async function SuspendedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // プロフィールの停止状態を確認
  const { data: profile } = await supabase
    .from(TABLES.PROFILES)
    .select("is_suspended, suspended_until, suspension_reason")
    .eq("id", user.id)
    .single()

  // 停止されていない場合はホームへ
  if (!profile?.is_suspended) {
    redirect("/")
  }

  const isPermanent = !profile.suspended_until
  const endsAt = profile.suspended_until ? new Date(profile.suspended_until) : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {isPermanent ? <Ban className="h-16 w-16 text-red-500" /> : <Clock className="h-16 w-16 text-yellow-500" />}
          </div>
          <CardTitle className="text-xl">
            {isPermanent ? "アカウントが停止されています" : "アカウントが一時停止中です"}
          </CardTitle>
          <CardDescription>利用規約違反により、アカウントの利用が制限されています</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">停止理由:</span>
              <p className="mt-1">{profile.suspension_reason || "利用規約違反"}</p>
            </div>
            {endsAt && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">停止期間:</span>
                <p className="mt-1">{endsAt.toLocaleString("ja-JP")}まで</p>
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {isPermanent ? (
              <p>永久停止されたアカウントは復帰できません。 異議がある場合は、サポートまでお問い合わせください。</p>
            ) : (
              <p>
                停止期間が終了すると、自動的にアカウントが復帰します。
                異議がある場合は、サポートまでお問い合わせください。
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button variant="outline" asChild>
              <Link href="mailto:support@sasaeai.help" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                サポートに連絡
              </Link>
            </Button>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" className="w-full">
                ログアウト
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
