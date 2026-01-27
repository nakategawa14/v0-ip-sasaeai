"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart } from "lucide-react"
import { sendLike, removeLike } from "@/lib/actions/matching"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface LikeButtonProps {
  profileId: string
  initialIsLiked: boolean
  profileName: string
}

export function LikeButton({ profileId, initialIsLiked, profileName }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isLoading, setIsLoading] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const router = useRouter()

  const handleLike = async () => {
    setIsLoading(true)

    try {
      if (isLiked) {
        await removeLike(profileId)
        setIsLiked(false)
      } else {
        const result = await sendLike(profileId)
        setIsLiked(true)
        if (result.isMatch) {
          setShowMatchModal(true)
          setTimeout(() => {
            setShowMatchModal(false)
            router.push("/matches")
          }, 2000)
        }
      }
    } catch (error) {
      console.error("いいね処理エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleLike}
        disabled={isLoading}
        className="w-full"
        size="lg"
        variant={isLiked ? "default" : "outline"}
      >
        <Heart className={`h-5 w-5 mr-2 ${isLiked ? "fill-current" : ""}`} />
        {isLiked ? "いいね済み" : "いいね"}
      </Button>

      {showMatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary fill-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">マッチング成立!</h3>
                <p className="text-muted-foreground">
                  {profileName}さんとマッチングしました。メッセージを送ってみましょう!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
