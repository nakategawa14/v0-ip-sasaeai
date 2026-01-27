"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, CheckCircle, User } from "lucide-react"
import Link from "next/link"
import { OptimizedImage } from "@/components/ui/optimized-image"

interface MatchCardProps {
  match: {
    id: string
    matched_at: string
    profile: {
      id: string
      nickname: string
      gender?: string
      birth_date?: string
      prefecture?: string
      bio?: string
      profile_images?: string | string[]
      is_verified?: boolean
    }
  }
}

export function MatchCard({ match }: MatchCardProps) {
  const profileImages = (() => {
    try {
      if (typeof match.profile.profile_images === "string") {
        return JSON.parse(match.profile.profile_images)
      }
      return Array.isArray(match.profile.profile_images) ? match.profile.profile_images : []
    } catch {
      return []
    }
  })()

  const age = match.profile.birth_date
    ? new Date().getFullYear() - new Date(match.profile.birth_date).getFullYear()
    : null

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-64 bg-muted">
        <OptimizedImage
          src={profileImages[0]}
          alt={match.profile.nickname}
          fill
          containerClassName="h-full w-full"
          className="object-cover"
        />
        {match.profile.is_verified && (
          <Badge className="absolute top-2 right-2 bg-blue-500 z-10">
            <CheckCircle className="w-3 h-3 mr-1" />
            本人確認済み
          </Badge>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">
            {match.profile.nickname}
            {age && <span className="text-muted-foreground ml-2">({age}歳)</span>}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground mb-2">{match.profile.prefecture}</p>

        {match.profile.bio && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{match.profile.bio}</p>}

        <p className="text-xs text-muted-foreground mb-4">
          {new Date(match.matched_at).toLocaleDateString("ja-JP")} にマッチング
        </p>

        <div className="flex gap-2">
          <Link href={`/messages/${match.id}`} className="flex-1">
            <Button variant="default" className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" />
              メッセージ
            </Button>
          </Link>
          <Link href={`/profile/${match.profile.id}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              <User className="w-4 h-4 mr-2" />
              プロフィール
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
