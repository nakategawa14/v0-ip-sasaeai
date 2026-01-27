"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, MapPin } from "lucide-react"
import { unblockUser } from "@/lib/actions/block"
import { useToast } from "@/hooks/use-toast"
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

interface BlockedUser {
  id: string
  blocked_id: string
  created_at: string
  blocked_profile: {
    user_id: string
    nickname: string
    profile_images: string[]
    prefecture: string
    city: string
  }
}

interface BlockedUsersListProps {
  blocks: BlockedUser[]
}

export function BlockedUsersList({ blocks }: BlockedUsersListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [unblockingId, setUnblockingId] = useState<string | null>(null)

  const handleUnblock = async (blockedId: string, nickname: string) => {
    setUnblockingId(blockedId)

    const result = await unblockUser(blockedId)

    setUnblockingId(null)

    if (result.success) {
      toast({
        title: "ブロックを解除しました",
        description: `${nickname}さんのブロックを解除しました`,
      })
      router.refresh()
    } else {
      toast({
        title: "エラー",
        description: result.error || "ブロック解除に失敗しました",
        variant: "destructive",
      })
    }
  }

  if (blocks.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-600">ブロックしているユーザーはいません</p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {blocks.map((block) => {
        const profile = block.blocked_profile
        const profileImage = profile.profile_images?.[0]
        const isUnblocking = unblockingId === block.blocked_id

        return (
          <Card key={block.id} className="overflow-hidden">
            <div className="p-4">
              <div className="mb-4 flex items-start gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profileImage || "/placeholder.svg"} alt={profile.nickname} />
                  <AvatarFallback>{profile.nickname?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{profile.nickname}</h3>
                  <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-3 w-3" />
                    {profile.prefecture}
                    {profile.city && `・${profile.city}`}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(block.created_at).toLocaleDateString("ja-JP")}にブロック
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent" disabled={isUnblocking}>
                    {isUnblocking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        解除中...
                      </>
                    ) : (
                      "ブロックを解除"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{profile.nickname}さんのブロックを解除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      ブロックを解除すると、再びこのユーザーのプロフィールが表示され、いいねやメッセージのやり取りができるようになります。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleUnblock(block.blocked_id, profile.nickname)}>
                      ブロックを解除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
