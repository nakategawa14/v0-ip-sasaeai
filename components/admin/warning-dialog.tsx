"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertTriangle, Loader2 } from "lucide-react"
import { issueWarning, type WarningSeverity } from "@/lib/actions/warnings"
import { useRouter } from "next/navigation"

interface WarningDialogProps {
  userId: string
  userName: string
  relatedReportId?: string
}

export function WarningDialog({ userId, userName, relatedReportId }: WarningDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [severity, setSeverity] = useState<WarningSeverity>("warning")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const router = useRouter()

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("警告理由を入力してください")
      return
    }

    setLoading(true)
    try {
      const result = await issueWarning({
        userId,
        reason,
        severity,
        relatedReportId,
        notes: notes || undefined,
      })

      if (result.error) {
        alert(result.error)
      } else {
        if (result.shouldRecommendBan) {
          const confirmBan = confirm(
            `警告を送信しました。\n\n` +
              `このユーザーの警告回数: ${result.totalWarnings}回\n` +
              `（最終警告: ${result.finalWarnings}回）\n\n` +
              `BANを検討することを推奨します。\n` +
              `BANページに移動しますか？`,
          )
          if (confirmBan) {
            router.push(`/admin/users/${userId}`)
          }
        } else {
          alert("警告を送信しました")
        }
        setOpen(false)
        setReason("")
        setNotes("")
        setSeverity("warning")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 bg-transparent"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          警告を送る
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {userName}さんに警告を送る
          </DialogTitle>
          <DialogDescription>ユーザーに警告を送信します。警告は通知され、履歴として記録されます。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>警告レベル</Label>
            <RadioGroup value={severity} onValueChange={(v) => setSeverity(v as WarningSeverity)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="warning" id="warning" />
                <Label htmlFor="warning" className="flex-1 cursor-pointer">
                  <div className="font-medium">警告</div>
                  <div className="text-sm text-muted-foreground">軽度の違反に対する注意喚起</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer border-yellow-200 bg-yellow-50/50">
                <RadioGroupItem value="serious_warning" id="serious_warning" />
                <Label htmlFor="serious_warning" className="flex-1 cursor-pointer">
                  <div className="font-medium text-yellow-700">重大な警告</div>
                  <div className="text-sm text-muted-foreground">繰り返しの違反や重大な問題</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer border-red-200 bg-red-50/50">
                <RadioGroupItem value="final_warning" id="final_warning" />
                <Label htmlFor="final_warning" className="flex-1 cursor-pointer">
                  <div className="font-medium text-red-700">最終警告</div>
                  <div className="text-sm text-muted-foreground">次回違反でBANとなる最終通告</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">警告理由（ユーザーに表示されます）*</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例: 他のユーザーに対する不適切な発言が報告されました。利用規約をご確認の上、今後はご注意ください。"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">管理者メモ（ユーザーには表示されません）</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="内部用のメモ"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                警告を送信
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
