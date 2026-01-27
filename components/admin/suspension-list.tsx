"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Ban, Clock, UserCheck } from "lucide-react"
import { liftSuspension } from "@/lib/actions/suspensions"
import { useRouter } from "next/navigation"

type Suspension = {
  id: string
  user_id: string
  suspension_type: "temporary" | "permanent"
  suspension_reason: string
  starts_at: string
  ends_at: string | null
  warning_count: number
  user: {
    id: string
    nickname: string
    profile_images: string[]
  } | null
}

export function SuspensionList({ suspensions }: { suspensions: Suspension[] }) {
  const router = useRouter()
  const [selectedSuspension, setSelectedSuspension] = useState<Suspension | null>(null)
  const [liftReason, setLiftReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLiftSuspension = async () => {
    if (!selectedSuspension || !liftReason.trim()) return

    setIsLoading(true)
    const result = await liftSuspension(selectedSuspension.id, liftReason)
    setIsLoading(false)

    if (result.success) {
      setSelectedSuspension(null)
      setLiftReason("")
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  if (suspensions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">停止中のユーザーはいません</div>
  }

  return (
    <>
      <div className="space-y-4">
        {suspensions.map((suspension) => (
          <div key={suspension.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={suspension.user?.profile_images?.[0] || "/placeholder.svg"} />
                <AvatarFallback>{suspension.user?.nickname?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{suspension.user?.nickname || "不明なユーザー"}</span>
                  {suspension.suspension_type === "permanent" ? (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Ban className="h-3 w-3" />
                      永久BAN
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3" />
                      一時停止
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">理由: {suspension.suspension_reason}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span>開始: {new Date(suspension.starts_at).toLocaleString("ja-JP")}</span>
                  {suspension.ends_at && <span>終了: {new Date(suspension.ends_at).toLocaleString("ja-JP")}</span>}
                  <span>警告回数: {suspension.warning_count}回</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSuspension(suspension)}
              className="flex items-center gap-1"
            >
              <UserCheck className="h-4 w-4" />
              停止解除
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedSuspension} onOpenChange={() => setSelectedSuspension(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>停止を解除</DialogTitle>
            <DialogDescription>{selectedSuspension?.user?.nickname}さんのアカウント停止を解除します</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lift-reason">解除理由</Label>
              <Textarea
                id="lift-reason"
                placeholder="停止解除の理由を入力してください"
                value={liftReason}
                onChange={(e) => setLiftReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSuspension(null)} disabled={isLoading}>
              キャンセル
            </Button>
            <Button onClick={handleLiftSuspension} disabled={isLoading || !liftReason.trim()}>
              {isLoading ? "処理中..." : "停止を解除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
