"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface Match {
  id: string
  otherUser?: {
    id: string
    nickname: string
    profile_images?: string[]
    gender?: string
  }
  // 旧形式との互換性のため残す
  user1?: {
    id: string
    nickname: string
    profile_images?: string[]
    gender?: string
  }
  user2?: {
    id: string
    nickname: string
    profile_images?: string[]
    gender?: string
  }
  lastMessage?: { content: string; created_at: string }
  unreadCount?: number
}

interface MatchListProps {
  matches: Match[]
  currentUserId: string
  selectedMatchId?: string
}

export function MatchList({ matches, currentUserId, selectedMatchId }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">まだマッチがありません</p>
        <Link href="/search" className="mt-2 inline-block text-sm text-pink-600 hover:text-pink-700">
          お相手を探す
        </Link>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="divide-y">
        {matches.map((match) => {
          const otherUser = match.otherUser || (match.user1?.id === currentUserId ? match.user2 : match.user1)

          if (!otherUser) {
            return null
          }

          const isSelected = match.id === selectedMatchId
          const profileImage = otherUser.profile_images?.[0]

          return (
            <Link
              key={match.id}
              href={`/messages/${match.id}`}
              className={cn(
                "block p-4 transition-colors hover:bg-gray-50",
                isSelected && "bg-pink-50 hover:bg-pink-50",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                  {profileImage ? (
                    <Image
                      src={profileImage || "/placeholder.svg"}
                      alt={otherUser.nickname}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{otherUser.nickname}</span>
                    {match.unreadCount && match.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2 shrink-0">
                        {match.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {match.lastMessage && <p className="truncate text-sm text-gray-600">{match.lastMessage.content}</p>}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
