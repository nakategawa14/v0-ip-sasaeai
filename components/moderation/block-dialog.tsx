"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { blockUser } from "@/lib/actions/moderation"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface BlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
}

export function BlockDialog({ open, onOpenChange, userId, userName }: BlockDialogProps) {
  const [isBlocking, setIsBlocking] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleBlock = async () => {
    setIsBlocking(true)

    const result = await blockUser(userId)

    setIsBlocking(false)

    if (result.success) {
      toast({
        title: "ブロックしました",
        description: `${userName}さんをブロックしました。今後、この方からのメッセージは表示されません。`,
      })
      onOpenChange(false)
      router.refresh()
    } else {
      toast({
        title: "エラー",
        description: result.error || "ブロックに失敗しました",
        variant: "destructive",
      })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{userName}さんをブロックしますか？</AlertDialogTitle>
          <AlertDialogDescription>
            ブロックすると、この方からのメッセージは表示されなくなり、グループチャットでもやり取りができなくなります。いつでもブロックを解除できます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBlocking}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlock}
            disabled={isBlocking}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isBlocking ? "ブロック中..." : "ブロックする"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
