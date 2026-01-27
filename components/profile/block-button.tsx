"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Ban, Loader2 } from "lucide-react"
import { blockUser, unblockUser } from "@/lib/actions/block"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BlockButtonProps {
  profileId: string
  isBlocked?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function BlockButton({
  profileId,
  isBlocked = false,
  variant = "outline",
  size = "default",
  className,
}: BlockButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [blocked, setBlocked] = useState(isBlocked)

  const handleBlock = async () => {
    setLoading(true)

    try {
      if (blocked) {
        const result = await unblockUser(profileId)
        if (result.success) {
          setBlocked(false)
          router.refresh()
        }
      } else {
        const result = await blockUser(profileId)
        if (result.success) {
          setBlocked(true)
          router.refresh()
          router.push("/search")
        }
      }
    } catch (error) {
      console.error("[v0] Error handling block:", error)
    } finally {
      setLoading(false)
    }
  }

  if (blocked) {
    return (
      <Button variant={variant} size={size} onClick={handleBlock} disabled={loading} className={className}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
        ブロック解除
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={loading} className={className}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
          ブロック
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このユーザーをブロックしますか？</AlertDialogTitle>
          <AlertDialogDescription>
            ブロックすると、お互いにプロフィールが表示されなくなります。 既存のいいねやマッチングも削除されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handleBlock}>ブロックする</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
