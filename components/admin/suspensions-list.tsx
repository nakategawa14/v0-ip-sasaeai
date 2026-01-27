"use client"

import { useState } from "react"
import { Ban, Clock, UserX, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { liftSuspension, type Suspension } from "@/lib/actions/suspensions"
import { useRouter } from "next/navigation"

interface SuspensionsListProps {
  suspensions: (Suspension & { user_nickname: string; user_email: string })[]
}

export function SuspensionsList({ suspensions }: SuspensionsListProps) {
  const router = useRouter()
  const [liftDialogOpen, setLiftDialogOpen] = useState(false)
  const [selectedSuspension, setSelectedSuspension] = useState<Suspension | null>(null)
  const [liftReason, setLiftReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLift = async () => {
    if (!selectedSuspension || !liftReason.trim()) return

    setIsSubmitting(true)
    const result = await liftSuspension(selectedSuspension.id, liftReason)
    setIsSubmitting(false)

    if (result.success) {
      setLiftDialogOpen(false)
      setSelectedSuspension(null)
      setLiftReason("")
      router.refresh()
    } else {
      alert(result.error || "エラーが発生しました")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (suspensions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">現在停止中のユーザーはいません</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5" />
            停止中ユーザー（{suspensions.length}件）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suspensions.map((suspension) => (
              <div
                key={suspension.id}
                className={`border rounded-lg p-4 ${
                  suspension.type === "permanent" ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-full ${suspension.type === "permanent" ? "bg-red-100" : "bg-orange-100"}`}
                    >
                      {suspension.type === "permanent" ? (
                        <Ban className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{suspension.user_nickname}</p>
                      <p className="text-sm text-gray-600">{suspension.user_email}</p>
                      <div className="mt-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            suspension.type === "permanent"
                              ? "bg-red-100 text-red-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {suspension.type === "permanent" ? "永久BAN" : "一時停止"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-medium">理由:</span> {suspension.reason}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">停止日時: {formatDate(suspension.suspended_at)}</p>
                      {suspension.type === "temporary" && suspension.expires_at && (
                        <p className="text-xs text-orange-600 mt-1">解除予定: {formatDate(suspension.expires_at)}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSuspension(suspension)
                      setLiftDialogOpen(true)
                    }}
                  >
                    解除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={liftDialogOpen} onOpenChange={setLiftDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>停止を解除</DialogTitle>
            <DialogDescription>このユーザーの停止を解除しますか？</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="liftReason">解除理由</Label>
            <Textarea
              id="liftReason"
              value={liftReason}
              onChange={(e) => setLiftReason(e.target.value)}
              placeholder="解除理由を入力..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLiftDialogOpen(false)} disabled={isSubmitting}>
              キャンセル
            </Button>
            <Button onClick={handleLift} disabled={isSubmitting || !liftReason.trim()}>
              {isSubmitting ? "処理中..." : "解除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
