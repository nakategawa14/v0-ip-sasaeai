"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"
import { updateReportStatus } from "@/lib/actions/report"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { WarningDialog } from "./warning-dialog"
import { UserWarningHistory } from "./user-warning-history"
import { SuspendUserDialog } from "./suspend-user-dialog"

export function ReportDetailView({ report }: { report: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [adminNotes, setAdminNotes] = useState(report.admin_notes || "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleUpdateStatus = async (status: "reviewing" | "resolved" | "dismissed") => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const result = await updateReportStatus(report.id, status, adminNotes)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("レポートを更新しました")
        setTimeout(() => {
          router.push("/admin/reports")
          router.refresh()
        }, 1500)
      }
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
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
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <Badge
                variant={
                  report.status === "pending" ? "destructive" : report.status === "resolved" ? "default" : "secondary"
                }
              >
                {report.status === "pending"
                  ? "未対応"
                  : report.status === "reviewing"
                    ? "対応中"
                    : report.status === "resolved"
                      ? "解決済み"
                      : "却下"}
              </Badge>
              <span className="text-sm text-gray-600">{new Date(report.created_at).toLocaleString("ja-JP")}</span>
            </div>

            <h2 className="mb-2 text-xl font-semibold">{report.reason}</h2>
            {report.details && (
              <div className="mb-4 rounded-lg bg-gray-50 p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{report.details}</p>
              </div>
            )}
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
                  disabled={loading || report.status === "resolved" || report.status === "dismissed"}
                />
              </div>

              {report.status === "pending" && (
                <div className="flex gap-3 flex-wrap">
                  <Button onClick={() => handleUpdateStatus("reviewing")} disabled={loading} variant="outline">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    対応中にする
                  </Button>
                  <Button onClick={() => handleUpdateStatus("resolved")} disabled={loading}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    解決済みにする
                  </Button>
                  <Button onClick={() => handleUpdateStatus("dismissed")} disabled={loading} variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    却下する
                  </Button>
                </div>
              )}

              {report.status === "reviewing" && (
                <div className="flex gap-3 flex-wrap">
                  <Button onClick={() => handleUpdateStatus("resolved")} disabled={loading}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    解決済みにする
                  </Button>
                  <Button onClick={() => handleUpdateStatus("dismissed")} disabled={loading} variant="destructive">
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
                <p className="text-sm text-gray-600">表示名</p>
                <p className="font-medium">{report.reporter?.display_name || "不明"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">メールアドレス</p>
                <p className="font-medium">{report.reporter?.email || "不明"}</p>
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
                <p className="text-sm text-gray-600">表示名</p>
                <p className="font-medium">{report.reported?.display_name || "不明"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">メールアドレス</p>
                <p className="font-medium">{report.reported?.email || "不明"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ユーザーID</p>
                <p className="font-mono text-xs text-gray-700">{report.reported_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ステータス</p>
                <Badge variant={report.reported?.is_active ? "default" : "destructive"}>
                  {report.reported?.is_active ? "アクティブ" : "停止中"}
                </Badge>
              </div>
              <div className="flex flex-col gap-2 mt-3">
                <WarningDialog
                  userId={report.reported_id}
                  userName={report.reported?.display_name || "不明"}
                  relatedReportId={report.id}
                />
                <SuspendUserDialog userId={report.reported_id} userName={report.reported?.display_name || "不明"} />
                <Link href={`/admin/users/${report.reported_id}`}>
                  <Button variant="outline" className="w-full bg-transparent">
                    ユーザー詳細を見る
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <UserWarningHistory userId={report.reported_id} />
        </div>
      </div>
    </div>
  )
}
