"use client"

import { useState } from "react"
import { Ban, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createSuspension } from "@/lib/actions/suspensions"

interface SuspensionDialogProps {
  userId: string
  userName: string
  warningCount: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const DURATION_OPTIONS = [
  { value: 7, label: "7日間" },
  { value: 14, label: "14日間" },
  { value: 30, label: "30日間" },
  { value: 90, label: "90日間" },
]

export function SuspensionDialog({
  userId,
  userName,
  warningCount,
  isOpen,
  onClose,
  onSuccess,
}: SuspensionDialogProps) {
  const [suspensionType, setSuspensionType] = useState<"temporary" | "permanent">("temporary")
  const [duration, setDuration] = useState(7)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("停止理由を入力してください")
      return
    }

    setIsSubmitting(true)

    const result = await createSuspension(
      userId,
      suspensionType,
      reason,
      suspensionType === "temporary" ? duration : undefined,
    )

    setIsSubmitting(false)

    if (result.success) {
      onSuccess()
      onClose()
      setReason("")
      setSuspensionType("temporary")
      setDuration(7)
    } else {
      alert(result.error || "エラーが発生しました")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Ban className="w-5 h-5" />
            ユーザーを停止
          </DialogTitle>
          <DialogDescription>{userName}さんのアカウントを停止します</DialogDescription>
        </DialogHeader>

        {warningCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">このユーザーは過去に{warningCount}回警告を受けています</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">停止タイプ</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setSuspensionType("temporary")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  suspensionType === "temporary"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">一時停止</span>
                </div>
                <p className="text-xs text-gray-600">期間終了後に自動で復帰</p>
              </button>
              <button
                type="button"
                onClick={() => setSuspensionType("permanent")}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  suspensionType === "permanent" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Ban className="w-4 h-4 text-red-600" />
                  <span className="font-medium">永久BAN</span>
                </div>
                <p className="text-xs text-gray-600">管理者が解除するまで利用不可</p>
              </button>
            </div>
          </div>

          {suspensionType === "temporary" && (
            <div>
              <Label className="text-base font-medium">停止期間</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDuration(option.value)}
                    className={`p-2 border rounded-lg text-sm transition-colors ${
                      duration === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="reason" className="text-base font-medium">
              停止理由 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="停止理由を入力してください..."
              className="mt-2"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">この理由はユーザーにメールで通知されます</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className={
              suspensionType === "permanent" ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"
            }
          >
            {isSubmitting ? "処理中..." : suspensionType === "permanent" ? "永久BANする" : "一時停止する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
