"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createReport, type ReportType, type ContextType } from "@/lib/actions/moderation"
import { useToast } from "@/hooks/use-toast"

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportedUserId: string
  reportedUserName: string
  contextType: ContextType
  contextId?: string
}

export function ReportDialog({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName,
  contextType,
  contextId,
}: ReportDialogProps) {
  const [reportType, setReportType] = useState<ReportType>("harassment")
  const [reportReason, setReportReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!reportReason.trim()) {
      toast({
        title: "エラー",
        description: "通報理由を入力してください",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const result = await createReport({
      reportedUserId,
      reportType,
      reportReason,
      contextType,
      contextId,
    })

    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: "通報を送信しました",
        description: "運営チームが確認し、適切に対応いたします",
      })
      onOpenChange(false)
      setReportReason("")
    } else {
      toast({
        title: "エラー",
        description: result.error || "通報の送信に失敗しました",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{reportedUserName}さんを通報</DialogTitle>
          <DialogDescription>
            不適切な行為を見つけた場合は、運営チームにご報告ください。内容を確認の上、適切に対応いたします。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>通報理由</Label>
            <RadioGroup value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="harassment" id="harassment" />
                <Label htmlFor="harassment" className="font-normal cursor-pointer">
                  ハラスメント・しつこい行為
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spam" id="spam" />
                <Label htmlFor="spam" className="font-normal cursor-pointer">
                  スパム・宣伝行為
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inappropriate" id="inappropriate" />
                <Label htmlFor="inappropriate" className="font-normal cursor-pointer">
                  不適切なコンテンツ
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">
                  その他
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">詳細（必須）</Label>
            <Textarea
              id="reason"
              placeholder="具体的な状況を教えてください"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} variant="destructive">
            {isSubmitting ? "送信中..." : "通報する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
