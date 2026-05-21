import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Mail, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react"
import { EmailRetryButtons } from "@/components/admin/email-retry-buttons"

export default async function EmailLogsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("sasaeai_profiles").select("is_admin").eq("user_id", user.id).single()

  if (!profile?.is_admin) redirect("/dashboard")

  // メールログを取得
  let logs: Array<{
    id: string
    recipient_email: string
    subject: string
    email_type: string
    status: string
    error_message: string | null
    retry_count: number
    sent_at: string | null
    created_at: string
  }> = []

  try {
    const { data, error } = await supabase
      .from("sasaeai_email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && data) {
      logs = data
    }
  } catch {
    // テーブルが存在しない場合は空配列
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            送信済み
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            失敗
          </Badge>
        )
      case "retrying":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <RefreshCw className="h-3 w-3 mr-1" />
            リトライ中
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            保留中
          </Badge>
        )
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "verification_approved":
        return <Badge variant="outline">本人確認承認</Badge>
      case "verification_rejected":
        return <Badge variant="outline">本人確認却下</Badge>
      case "bulk":
        return <Badge variant="outline">一斉送信</Badge>
      case "individual":
        return <Badge variant="outline">個別送信</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 統計を計算
  const stats = {
    total: logs.length,
    sent: logs.filter((l) => l.status === "sent").length,
    failed: logs.filter((l) => l.status === "failed").length,
    pending: logs.filter((l) => l.status === "pending" || l.status === "retrying").length,
    retryable: logs.filter((l) => l.status === "failed" && l.retry_count < 3).length,
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            管理画面に戻る
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">メール送信ログ</h1>
            <p className="text-muted-foreground">送信履歴と配信状況の確認</p>
          </div>
        </div>
        {stats.retryable > 0 && <EmailRetryButtons retryableCount={stats.retryable} />}
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">総送信数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <p className="text-sm text-muted-foreground">送信成功</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-sm text-muted-foreground">送信失敗</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">保留/リトライ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.retryable}</div>
            <p className="text-sm text-muted-foreground">リトライ可能</p>
          </CardContent>
        </Card>
      </div>

      {/* ログ一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>送信履歴</CardTitle>
          <CardDescription>最新100件の送信ログを表示</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>送信ログがありません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium">日時</th>
                    <th className="text-left py-3 px-2 text-sm font-medium">宛先</th>
                    <th className="text-left py-3 px-2 text-sm font-medium">件名</th>
                    <th className="text-left py-3 px-2 text-sm font-medium">種別</th>
                    <th className="text-left py-3 px-2 text-sm font-medium">状態</th>
                    <th className="text-left py-3 px-2 text-sm font-medium">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 text-sm">{formatDate(log.created_at)}</td>
                      <td className="py-3 px-2 text-sm">
                        <span className="truncate max-w-[200px] block">{log.recipient_email}</span>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <span className="truncate max-w-[250px] block">{log.subject}</span>
                      </td>
                      <td className="py-3 px-2">{getTypeBadge(log.email_type)}</td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(log.status)}
                          {log.error_message && (
                            <span className="text-xs text-red-600 truncate max-w-[150px]" title={log.error_message}>
                              {log.error_message}
                            </span>
                          )}
                          {log.retry_count > 0 && (
                            <span className="text-xs text-muted-foreground">リトライ: {log.retry_count}回</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {log.status === "failed" && log.retry_count < 3 && <EmailRetryButtons logId={log.id} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
