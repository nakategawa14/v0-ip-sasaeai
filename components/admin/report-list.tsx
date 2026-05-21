"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { updateReportStatus, banUser, type BanType } from "@/lib/actions/moderation"
import { useToast } from "@/hooks/use-toast"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, Ban, CheckCircle, XCircle } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  report_type: string
  report_reason: string
  context_type: string
  context_id: string | null
  status: string
  admin_notes: string | null
  created_at: string
  reporter?: {
    id?: string
    user_id?: string
    nickname?: string
    profile_images?: string | string[]
  }
  reported_user?: {
    id?: string
    user_id?: string
    nickname?: string
    profile_images?: string | string[]
  }
}

interface ReportListProps {
  reports: Report[]
  currentStatus?: string
}

export function ReportList({ reports, currentStatus }: ReportListProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [banType, setBanType] = useState<BanType>("group_chat")
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const refreshReportsList = () => {
    const query = searchParams.toString()
    const href = query ? `${pathname}?${query}` : pathname
    router.replace(href)
    router.refresh()
  }

  const getProfileImage = (profileImages: string | string[] | undefined) => {
    if (!profileImages) return undefined
    if (typeof profileImages === "string") {
      try {
        const parsed = JSON.parse(profileImages)
        return Array.isArray(parsed) ? parsed[0] : undefined
      } catch {
        return undefined
      }
    }
    return Array.isArray(profileImages) ? profileImages[0] : undefined
  }

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      harassment: "ハラスメント",
      spam: "スパム",
      inappropriate: "不適切",
      other: "その他",
    }
    return labels[type] || type
  }

  const getContextTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      group_chat: "グループチャット",
      direct_message: "ダイレクトメッセージ",
      profile: "プロフィール",
    }
    return labels[type] || type
  }

  const handleReview = (report: Report) => {
    setSelectedReport(report)
    setAdminNotes(report.admin_notes || "")
    setReviewDialogOpen(true)
  }

  const handleBan = (report: Report) => {
    setSelectedReport(report)
    setBanReason(report.report_reason)
    setBanDialogOpen(true)
  }

  const handleUpdateStatus = async (status: "reviewed" | "action_taken" | "dismissed") => {
    if (!selectedReport) return

    setIsSubmitting(true)
    const result = await updateReportStatus(selectedReport.id, status, adminNotes)
    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: "ステータスを更新しました",
      })
      setReviewDialogOpen(false)
      setSelectedReport(null)
      refreshReportsList()
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  const handleBanUser = async () => {
    if (!selectedReport) return

    setIsSubmitting(true)

    const banExpiresAt = banDuration
      ? new Date(Date.now() + Number.parseInt(banDuration) * 24 * 60 * 60 * 1000).toISOString()
      : undefined

    const result = await banUser({
      userId: selectedReport.reported_user_id,
      banType,
      banReason,
      banExpiresAt,
    })

    if (result.success) {
      await updateReportStatus(selectedReport.id, "action_taken", `BANを実施: ${banReason}`)
      toast({
        title: "BANを実施しました",
      })
      setBanDialogOpen(false)
      setSelectedReport(null)
      refreshReportsList()
    } else {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  return (
    <>
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/reports">
            <Badge variant={!currentStatus ? "default" : "outline"}>全て</Badge>
          </Link>
          <Link href="/admin/reports?status=pending">
            <Badge variant={currentStatus === "pending" ? "default" : "outline"}>未対応</Badge>
          </Link>
          <Link href="/admin/reports?status=reviewed">
            <Badge variant={currentStatus === "reviewed" ? "default" : "outline"}>確認済み</Badge>
          </Link>
          <Link href="/admin/reports?status=action_taken">
            <Badge variant={currentStatus === "action_taken" ? "default" : "outline"}>対応済み</Badge>
          </Link>
          <Link href="/admin/reports?status=dismissed">
            <Badge variant={currentStatus === "dismissed" ? "default" : "outline"}>却下</Badge>
          </Link>
        </div>
      </Card>

      <div className="space-y-4">
        {reports && reports.length > 0 ? (
          reports.map((report) => {
            const reportId = typeof report.id === "string" ? report.id.trim() : ""
            const detailHref = reportId ? `/admin/reports/${reportId}` : ""
            const reporterImage = getProfileImage(report.reporter?.profile_images)
            const reportedImage = getProfileImage(report.reported_user?.profile_images)

            return (
              <Card key={report.id} className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <Badge
                        variant={
                          report.status === "pending"
                            ? "destructive"
                            : report.status === "action_taken"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {report.status === "pending"
                          ? "未対応"
                          : report.status === "reviewed"
                            ? "確認済み"
                            : report.status === "action_taken"
                              ? "対応済み"
                              : "却下"}
                      </Badge>
                      <Badge variant="outline">{getReportTypeLabel(report.report_type)}</Badge>
                      <Badge variant="outline">{getContextTypeLabel(report.context_type)}</Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleString("ja-JP")}
                      </span>
                    </div>

                    <div className="mb-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700">通報者:</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reporterImage || "/placeholder.svg"} />
                          <AvatarFallback>{report.reporter?.nickname?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{report.reporter?.nickname || "不明"}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700">通報対象:</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reportedImage || "/placeholder.svg"} />
                          <AvatarFallback>{report.reported_user?.nickname?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{report.reported_user?.nickname || "不明"}</span>
                      </div>
                    </div>

                    <div className="mb-3 rounded-lg bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">通報理由:</p>
                      <p className="text-gray-900">{report.report_reason}</p>
                    </div>

                    {report.admin_notes && (
                      <div className="rounded-lg bg-blue-50 p-4">
                        <p className="text-sm font-semibold text-blue-700 mb-2">管理者メモ:</p>
                        <p className="text-blue-900">{report.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                    {report.id ? report.id : "IDがありません"}
                  </span>
                  {detailHref ? (
                    <Link href={detailHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      詳細ページ
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      詳細ページ（IDなし）
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => handleReview(report)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    確認・対応
                  </Button>
                  {report.status === "pending" && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => handleBan(report)}>
                      <Ban className="h-4 w-4 mr-2" />
                      BANする
                    </Button>
                  )}
                </div>
              </Card>
            )
          })
        ) : (
          <Card className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">通報はありません</p>
          </Card>
        )}
      </div>

      {selectedReport && (
        <>
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>通報の確認・対応</DialogTitle>
                <DialogDescription>通報内容を確認し、適切な対応を選択してください</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label>管理者メモ</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="対応内容や備考を入力..."
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleUpdateStatus("dismissed")}
                  disabled={isSubmitting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  却下
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleUpdateStatus("reviewed")}
                  disabled={isSubmitting}
                >
                  確認済みにする
                </Button>
                <Button type="button" onClick={() => void handleUpdateStatus("action_taken")} disabled={isSubmitting}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  対応済みにする
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>ユーザーをBANする</DialogTitle>
                <DialogDescription>
                  {selectedReport.reported_user?.nickname}さんをBANします。BAN内容を選択してください。
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label>BAN種類</Label>
                  <RadioGroup value={banType} onValueChange={(value) => setBanType(value as BanType)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="group_chat" id="ban-group-chat" />
                      <Label htmlFor="ban-group-chat" className="font-normal cursor-pointer">
                        グループチャット利用停止
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="messaging" id="ban-messaging" />
                      <Label htmlFor="ban-messaging" className="font-normal cursor-pointer">
                        メッセージ機能利用停止
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="platform" id="ban-platform" />
                      <Label htmlFor="ban-platform" className="font-normal cursor-pointer">
                        プラットフォーム全体の利用停止
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>BAN理由</Label>
                  <Textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="BAN理由を入力..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>BAN期間（日数）</Label>
                  <Input
                    type="number"
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    placeholder="空欄で永久BAN"
                  />
                  <p className="text-sm text-gray-600 mt-1">空欄にすると永久BANになります</p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBanDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  キャンセル
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleBanUser()}
                  disabled={isSubmitting || !banReason.trim()}
                  variant="destructive"
                >
                  {isSubmitting ? "処理中..." : "BANを実施"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  )
}
