"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, MessageCircle, Clock, Calendar, Shield, UserCircle } from "lucide-react"
import Link from "next/link"
import { joinGroupChat } from "@/lib/actions/group-chat"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface GroupChatRoom {
  id: string
  name: string
  description: string | null
  participant_count: number
  last_activity_at: string
  isParticipant: boolean
  host_id: string | null
  category: string | null
  max_participants: number | null
  scheduled_start_time: string | null
  scheduled_end_time: string | null
  is_official: boolean
  status: string | null
  host?: {
    nickname: string
    profile_image_1: string | null
  } | null
  lastMessage?: {
    content: string
    created_at: string
    sasaeai_profiles?: {
      nickname: string
    }
  } | null
}

interface GroupChatRoomListProps {
  rooms: GroupChatRoom[]
  canParticipate: boolean
}

function getCategoryLabel(category: string | null) {
  const labels: Record<string, string> = {
    general: "雑談",
    disability: "障害年金",
    work: "就労支援",
    love: "恋愛相談",
    health: "健康・医療",
    hobby: "趣味",
    region: "地域別",
    other: "その他",
  }
  return category ? labels[category] || category : "雑談"
}

function getStatusBadge(room: GroupChatRoom) {
  const now = new Date()
  const startTime = room.scheduled_start_time ? new Date(room.scheduled_start_time) : null
  const endTime = room.scheduled_end_time ? new Date(room.scheduled_end_time) : null

  if (room.status === "closed") {
    return { text: "終了", variant: "secondary" as const }
  }

  if (startTime && endTime) {
    if (now < startTime) {
      return { text: "予約受付中", variant: "outline" as const }
    } else if (now >= startTime && now <= endTime) {
      return { text: "LIVE中", variant: "destructive" as const }
    } else {
      return { text: "終了", variant: "secondary" as const }
    }
  }

  return { text: "開催中", variant: "default" as const }
}

export function GroupChatRoomList({ rooms, canParticipate }: GroupChatRoomListProps) {
  const router = useRouter()
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null)

  const handleJoinRoom = async (roomId: string) => {
    if (!canParticipate) {
      alert("グループチャットへの参加には有料プランが必要です")
      return
    }

    setJoiningRoomId(roomId)
    try {
      await joinGroupChat(roomId)
      router.push(`/group-chat/${roomId}`)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error joining room:", error)
      alert(error instanceof Error ? error.message : "参加に失敗しました")
    } finally {
      setJoiningRoomId(null)
    }
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">現在アクティブなチャットルームはありません</p>
        <p className="text-sm text-gray-500">新しいルームを作成してみましょう</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {rooms.map((room) => {
        const statusBadge = getStatusBadge(room)
        const isFull = room.max_participants && room.participant_count >= room.max_participants
        const now = new Date()
        const endTime = room.scheduled_end_time ? new Date(room.scheduled_end_time) : null
        const isEnded = (endTime && now > endTime) || room.status === "closed"
        const startTime = room.scheduled_start_time ? new Date(room.scheduled_start_time) : null
        const hasNotStarted = startTime && now < startTime

        return (
          <Card key={room.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400">
                {room.host?.profile_image_1 ? (
                  <AvatarImage src={room.host.profile_image_1 || "/placeholder.svg"} alt={room.host.nickname} />
                ) : (
                  <AvatarFallback className="text-white font-bold">
                    {room.is_official ? <Shield className="h-6 w-6" /> : <UserCircle className="h-6 w-6" />}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
                      {room.is_official && (
                        <Badge variant="default" className="bg-blue-500">
                          <Shield className="h-3 w-3 mr-1" />
                          公式
                        </Badge>
                      )}
                      <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(room.category)}
                      </Badge>
                      {room.host && !room.is_official && (
                        <span className="flex items-center gap-1">
                          <UserCircle className="h-3 w-3" />
                          主: {room.host.nickname}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
                    <Users className="h-4 w-4" />
                    <span>
                      {room.participant_count}
                      {room.max_participants && `/${room.max_participants}`}
                    </span>
                  </div>
                </div>

                {room.description && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{room.description}</p>}

                {room.scheduled_start_time && room.scheduled_end_time && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(room.scheduled_start_time).toLocaleString("ja-JP", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ~{" "}
                      {new Date(room.scheduled_end_time).toLocaleString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}

                {room.lastMessage && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <MessageCircle className="h-3 w-3" />
                    <span className="truncate">
                      {room.lastMessage.sasaeai_profiles?.nickname}: {room.lastMessage.content}
                    </span>
                    <Clock className="h-3 w-3 ml-auto flex-shrink-0" />
                    <span className="text-xs flex-shrink-0">
                      {new Date(room.lastMessage.created_at).toLocaleDateString("ja-JP", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  {room.isParticipant ? (
                    isEnded ? (
                      <Button size="sm" variant="outline" disabled>
                        終了
                      </Button>
                    ) : hasNotStarted ? (
                      <Button size="sm" variant="outline" disabled>
                        開始前
                      </Button>
                    ) : (
                      <Button size="sm" asChild className="bg-gradient-to-r from-pink-500 to-purple-500">
                        <Link href={`/group-chat/${room.id}`}>チャットを開く</Link>
                      </Button>
                    )
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={!canParticipate || joiningRoomId === room.id || isFull || isEnded}
                    >
                      {joiningRoomId === room.id ? "参加中..." : isFull ? "満員" : isEnded ? "終了" : "参加する"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
