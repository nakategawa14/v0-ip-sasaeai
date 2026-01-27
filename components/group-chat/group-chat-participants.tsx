"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, MoreVertical, AlertTriangle, Ban, LogOut } from "lucide-react"
import Link from "next/link"
import { ReportDialog } from "@/components/moderation/report-dialog"
import { BlockDialog } from "@/components/moderation/block-dialog"
import { leaveGroupChat } from "@/lib/actions/group-chat"
import { useRouter } from "next/navigation"

interface Participant {
  id: string
  user_id: string
  joined_at: string
  sasaeai_profiles?: {
    id: string
    nickname: string
    profile_images: string | string[]
  }
}

interface GroupChatParticipantsProps {
  participants: Participant[]
  currentUserId: string
  roomId: string
}

export function GroupChatParticipants({ participants, currentUserId, roomId }: GroupChatParticipantsProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null)
  const router = useRouter()

  const getProfileImage = (profileImages: string | string[] | undefined) => {
    if (!profileImages) return undefined
    if (typeof profileImages === "string") {
      try {
        const parsed = JSON.parse(profileImages)
        return Array.isArray(parsed) ? parsed[0] : undefined
      } catch {
        return undefined
      }
    }
    return Array.isArray(profileImages) ? profileImages[0] : undefined
  }

  const handleReport = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName })
    setReportDialogOpen(true)
  }

  const handleBlock = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName })
    setBlockDialogOpen(true)
  }

  const handleLeaveRoom = async () => {
    if (!confirm("このルームから退出しますか？")) return

    try {
      await leaveGroupChat(roomId)
      router.push("/group-chat")
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to leave room:", error)
      alert("退出に失敗しました")
    }
  }

  return (
    <>
      <Card className="h-full p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold">参加者 ({participants.length})</h3>
        </div>
        <div className="space-y-2">
          {participants.map((participant) => {
            const isCurrentUser = participant.user_id === currentUserId
            const profileImage = getProfileImage(participant.sasaeai_profiles?.profile_images)
            const userName = participant.sasaeai_profiles?.nickname || "名前未設定"

            return (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Link
                  href={`/profile/${participant.sasaeai_profiles?.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profileImage || "/placeholder.svg"} alt={userName} />
                    <AvatarFallback>{userName[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{userName}</p>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">
                        あなた
                      </Badge>
                    )}
                  </div>
                </Link>

                {isCurrentUser ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleLeaveRoom} className="text-destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        退出する
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleReport(participant.user_id, userName)}>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        通報する
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBlock(participant.user_id, userName)}
                        className="text-destructive"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        ブロックする
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {selectedUser && (
        <>
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            reportedUserId={selectedUser.id}
            reportedUserName={selectedUser.name}
            contextType="group_chat"
            contextId={roomId}
          />
          <BlockDialog
            open={blockDialogOpen}
            onOpenChange={setBlockDialogOpen}
            userId={selectedUser.id}
            userName={selectedUser.name}
          />
        </>
      )}
    </>
  )
}
