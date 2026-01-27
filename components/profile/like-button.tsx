"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { TABLES } from "@/lib/supabase/table-names"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  profileId: string
  currentUserId: string
  hasLiked: boolean
  className?: string
}

export function LikeButton({ profileId, currentUserId, hasLiked, className }: LikeButtonProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(hasLiked)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      if (liked) {
        // いいねを取り消し
        await supabase.from(TABLES.LIKES).delete().eq("from_user_id", currentUserId).eq("to_user_id", profileId)
        setLiked(false)
      } else {
        // いいねを送信
        await supabase.from(TABLES.LIKES).insert({
          from_user_id: currentUserId,
          to_user_id: profileId,
        })
        setLiked(true)
      }
      router.refresh()
    } catch (error) {
      console.error("Error handling like:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant={liked ? "default" : "outline"} className={cn(className)} onClick={handleLike} disabled={loading}>
      <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`} />
      {liked ? "いいね済み" : "いいね"}
    </Button>
  )
}
