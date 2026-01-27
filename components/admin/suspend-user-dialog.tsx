"use client"

import type React from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Ban, Clock } from "lucide-react"
import { suspendUser, type SuspensionDuration } from "@/lib/actions/suspensions"
import { useRouter } from "next/navigation"

type Props = {
  userId: string
  userName: string
  warningCount?: number
  trigger?: React.ReactNode
}

const DURATION_OPTIONS: { value: SuspensionDuration; label: string; description: string }[] = [
  { value: "7days", label: "7日間", description: "軽度の違反" },
  { value: "30days", label: "30日間", description: "中程度の違反" },
  { value: "90days", label: "90日間", description: "重度の違反" },
  { value: "permanent", label: "永久BAN", description: "極めて深刻な違反、再犯者" },
]

export function SuspendUserDialog({ userId, userName, warningCount = 0, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [duration, setDuration] = useState<SuspensionDuration>("7days")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSuspend = async () => {
    if (!reason.trim()) return

    setIsLoading(true)
    const result = await suspendUser({
      userId,
      duration,
      reason,
      warningCount,
    })
    setIsLoading(false)

    if (result.success) {
      setOpen(false)
      setReason("")
      setDuration("7days")
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm" className="flex items-center gap-1">
            <Ban className="h-4 w-4" />
            停止/BAN
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ユーザーを停止/BAN</DialogTitle>
          <DialogDescription>
            {userName}さんのアカウントを停止します
            {warningCount > 0 && (
              <span className="block mt-1 text-yellow-600">このユーザーは{warningCount}回の警告を受けています</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>停止期間</Label>
            <RadioGroup value={duration} onValueChange={(v) => setDuration(v as SuspensionDuration)}>
              {DURATION_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    duration === option.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setDuration(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="cursor-pointer flex items-center gap-2">
                      {option.value === "permanent" ? (
                        <Ban className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suspend-reason">停止理由 *</Label>
            <Textarea
              id="suspend-reason"
              placeholder="停止理由を具体的に入力してください"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={handleSuspend} disabled={isLoading || !reason.trim()}>
            {isLoading ? "処理中..." : duration === "permanent" ? "永久BANする" : "停止する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
