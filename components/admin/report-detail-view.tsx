"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { updateReportStatus } from "@/lib/actions/moderation"
import { CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { WarningDialog } from "./warning-dialog"
import { UserWarningHistory } from "./user-warning-history"
import { SuspendUserDialog } from "./suspend-user-dialog"
import { BlockUserButton } from "./block-user-button"
import { AdminOperationsPanel } from "./admin-operations-panel"

/** sasaeai_reports + embed（一覧ページと同形） */
export type SasaeaiReportDetail = {
  id: string
  reporter_id: string
  reported_user_id: string
  report_type: string
  report_reason?: string | null
  reason?: string | null
  context_type?: string | null
  context_id?: string | null
  status: string
  admin_notes?: string | null
  admin_note?: string | null
  created_at: string
  reporter?: { user_id?: string; nickname?: string | null; profile_images?: unknown }
  reported_user?: {
    user_id?: string
    nickname?: string | null
    email?: string | null
    profile_images?: unknown
    is_active?: boolean | null
    status?: string | null
  }
}

type ModerationLogRow = {
  id: string
  action_type: string
  created_at: string
  admin_nickname?: string
  notes?: string | null
  details?: Record<string, unknown> | null
}

export function ReportDetailView({
  report,
  moderationLogs = [],
}: {
  report: SasaeaiReportDetail
  moderationLogs?: ModerationLogRow[]
}) {
  const [loading, setLoading] = useState(false)
  const [reportStatus, setReportStatus] = useState(report.status)
  const [adminNotes, setAdminNotes] = useState(report.admin_notes ?? report.admin_note ?? "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const detailText = [report.report_reason, report.reason].filter(Boolean).join("\n\n---\n\n") || "（詳細なし）"
  const reportedName = report.reported_user?.nickname ?? "不明"
  const reporterName = report.reporter?.nickname ?? "不明"

  const handleUpdateStatus = async (status: "reviewed" | "action_taken" | "dismissed") => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const result = await updateReportStatus(report.id, status, adminNotes)

      if (!result.success) {
        setError(result.error ?? "更新に失敗しました")
      } else {
        setReportStatus(status)
        setSuccess("通報ステータスを更新しました")
      }
    } catch {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const statusLabel =
    reportStatus === "pending"
      ? "未対応"
      : reportStatus === "reviewed"
        ? "確認済み"
        : reportStatus === "action_taken"
          ? "対応済み"
          : reportStatus === "dismissed"
            ? "却下"
            : reportStatus

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link href="/admin/reports" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            通報一覧に戻る
          </Link>
        </Button>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">通報詳細</h1>
        <p className="text-gray-600">通報ID: {report.id}</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {success && <Alert className="mb-4 border-green-500 bg-green-50 text-green-900">{success}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge
                variant={
                  reportStatus === "pending"
                    ? "destructive"
                    : reportStatus === "action_taken"
                      ? "default"
                      : "secondary"
                }
              >
                {statusLabel}
              </Badge>
              <Badge variant="outline">{report.report_type}</Badge>
              {report.context_type ? <Badge variant="outline">{report.context_type}</Badge> : null}
              <span className="text-sm text-gray-600">{new Date(report.created_at).toLocaleString("ja-JP")}</span>
            </div>

            <h2 className="mb-2 text-lg font-semibold text-gray-800">通報内容</h2>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-gray-800 whitespace-pre-wrap">{detailText}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">管理者メモ</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="adminNotes">対応内容・メモ</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="対応内容や管理者メモを入力してください"
                  rows={6}
                  disabled={
                    loading || reportStatus === "action_taken" || reportStatus === "dismissed"
                  }
                />
              </div>

              {reportStatus === "pending" && (
                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => void handleUpdateStatus("reviewed")} disabled={loading} variant="outline">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    確認済みにする
                  </Button>
                  <Button type="button" onClick={() => void handleUpdateStatus("action_taken")} disabled={loading}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    対応済みにする
                  </Button>
                  <Button type="button" onClick={() => void handleUpdateStatus("dismissed")} disabled={loading} variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    却下する
                  </Button>
                </div>
              )}

              {reportStatus === "reviewed" && (
                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => void handleUpdateStatus("action_taken")} disabled={loading}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    対応済みにする
                  </Button>
                  <Button type="button" onClick={() => void handleUpdateStatus("dismissed")} disabled={loading} variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    却下する
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">通報者情報</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">ニックネーム</p>
                <p className="font-medium">{reporterName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ユーザーID</p>
                <p className="font-mono text-xs text-gray-700">{report.reporter_id}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">通報対象者情報</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">ニックネーム</p>
                <p className="font-medium">{reportedName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ユーザーID</p>
                <p className="font-mono text-xs text-gray-700">{report.reported_user_id}</p>
              </div>
              {report.reported_user?.is_active !== undefined && report.reported_user?.is_active !== null && (
                <div>
                  <p className="text-sm text-gray-600">アカウント</p>
                  <Badge variant={report.reported_user.is_active ? "default" : "destructive"}>
                    {report.reported_user.is_active ? "アクティブ" : "非アクティブ"}
                  </Badge>
                </div>
              )}
              <div className="mt-3 flex flex-col gap-2">
                <BlockUserButton
                  userId={report.reported_user_id}
                  userLabel={reportedName}
                  disabled={report.reported_user?.status === "blocked"}
                  className="w-full"
                />
                <WarningDialog userId={report.reported_user_id} userName={reportedName} relatedReportId={report.id} />
                <SuspendUserDialog userId={report.reported_user_id} userName={reportedName} />
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href={`/admin/users/${report.reported_user_id}`}>ユーザー詳細を見る</Link>
                </Button>
              </div>
            </div>
          </Card>

          <AdminOperationsPanel
            reportId={report.id}
            targetUserId={report.reported_user_id}
            targetEmail={report.reported_user?.email ?? null}
            targetNickname={reportedName}
            moderationLogs={moderationLogs}
          />

          <UserWarningHistory userId={report.reported_user_id} />
        </div>
      </div>
    </div>
  )
}
