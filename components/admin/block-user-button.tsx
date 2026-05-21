"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, Loader2 } from "lucide-react"

import { adminBlockUser } from "@/lib/actions/moderation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

type Props = {
  userId: string
  userLabel: string
  /** 既に blocked のときは表示しない（親で制御） */
  disabled?: boolean
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link"
  className?: string
}

export function BlockUserButton({ userId, userLabel, disabled, variant = "destructive", className }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const onConfirm = async () => {
    setLoading(true)
    const res = await adminBlockUser(userId)
    setLoading(false)
    if (!res.success) {
      toast({
        title: "ブロックに失敗しました",
        description: res.error,
        variant: "destructive",
      })
      return
    }
    toast({
      title: "ユーザーをブロックしました",
      description: "status を blocked にし、アプリからアクセスできなくなります。",
    })
    setOpen(false)
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant} className={className} disabled={disabled}>
          <Ban className="mr-2 h-4 w-4" />
          このユーザーをブロックする
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ユーザーをブロックしますか？</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>
              「{userLabel}」の <strong>status</strong> を <strong>blocked</strong> にし、利用を停止します（
              <strong>is_active</strong> も false にします）。
            </span>
            <span className="block text-destructive">取り消しはユーザー詳細から「ブロック解除」で行えます。</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>キャンセル</AlertDialogCancel>
          <Button type="button" onClick={() => void onConfirm()} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                処理中…
              </>
            ) : (
              "ブロックする"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
