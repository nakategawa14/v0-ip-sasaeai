import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TABLES } from "@/lib/supabase/table-names"
import { getModerationLogs, type ModerationActionType } from "@/lib/actions/moderation-logs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Ban, CheckCircle, XCircle, Shield, Clock, User, FileText } from "lucide-react"

const actionTypeLabels: Record<ModerationActionType, string> = {
  warning_issued: "警告を発行",
  user_banned: "ユーザーをBAN",
  user_unbanned: "BANを解除",
  report_resolved: "通報を解決",
  report_dismissed: "通報を却下",
  user_suspended: "ユーザーを一時停止",
  user_unsuspended: "一時停止を解除",
  content_removed: "コンテンツを削除",
  verification_approved: "本人確認を承認",
  verification_rejected: "本人確認を却下",
}

const getActionLabel = (actionType: ModerationActionType): string => {
  return actionTypeLabels[actionType] || actionType
}

export default async function ModerationLogsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    redirect("/")
  }

  const { logs, total, error } = await getModerationLogs({ limit: 50 })

  const getActionIcon = (actionType: ModerationActionType) => {
    switch (actionType) {
      case "warning_issued":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "user_banned":
        return <Ban className="h-4 w-4 text-red-500" />
      case "user_unbanned":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "report_resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "report_dismissed":
        return <XCircle className="h-4 w-4 text-gray-500" />
      case "verification_approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "verification_rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Shield className="h-4 w-4 text-blue-500" />
    }
  }

  const getActionBadgeColor = (actionType: ModerationActionType) => {
    switch (actionType) {
      case "warning_issued":
        return "bg-yellow-100 text-yellow-800"
      case "user_banned":
        return "bg-red-100 text-red-800"
      case "user_unbanned":
        return "bg-green-100 text-green-800"
      case "report_resolved":
        return "bg-green-100 text-green-800"
      case "report_dismissed":
        return "bg-gray-100 text-gray-800"
      case "verification_approved":
        return "bg-green-100 text-green-800"
      case "verification_rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">モデレーションログ</h1>
        <p className="text-muted-foreground">管理者の対応履歴を確認できます</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            対応履歴（{total}件）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">対応履歴はありません</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">{getActionIcon(log.action_type as ModerationActionType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getActionBadgeColor(log.action_type as ModerationActionType)}>
                        {getActionLabel(log.action_type as ModerationActionType)}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.admin_nickname}
                      </span>
                    </div>
                    {log.target_user_nickname && (
                      <p className="text-sm mt-1">
                        対象ユーザー: <span className="font-medium">{log.target_user_nickname}</span>
                      </p>
                    )}
                    {log.notes && <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>}
                    {log.details && (
                      <div className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.created_at).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
