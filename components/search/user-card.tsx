"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { sendLike, removeLike } from "@/lib/actions/matching"
import { CardContent } from "@/components/ui/card"
import { OptimizedImage } from "@/components/ui/optimized-image"

interface UserCardProps {
  profile: any
  currentUserId: string
  hasLiked: boolean
}

export function UserCard({ profile, currentUserId, hasLiked }: UserCardProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(hasLiked)
  const [loading, setLoading] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)

  if (!profile || !profile.id || !profile.nickname || !profile.gender) {
    return null
  }

  const getProfileImages = () => {
    try {
      if (Array.isArray(profile.profile_images)) {
        return profile.profile_images
      }
      if (typeof profile.profile_images === "string") {
        return JSON.parse(profile.profile_images)
      }
      return []
    } catch {
      return []
    }
  }

  const profileImages = getProfileImages()
  const mainImage = profileImages[0]

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const age = profile.birth_date ? calculateAge(profile.birth_date) : null

  const genderDisplay =
    profile.gender === "男性" ? "男性" : profile.gender === "女性" ? "女性" : profile.gender || "未設定"

  const getDisabilityTypes = () => {
    try {
      if (Array.isArray(profile.disability_type)) {
        return profile.disability_type
      }
      if (typeof profile.disability_type === "string") {
        return JSON.parse(profile.disability_type)
      }
      return []
    } catch {
      return []
    }
  }

  const disabilityTypes = getDisabilityTypes()

  const handleLike = async () => {
    setLoading(true)

    try {
      if (liked) {
        await removeLike(profile.id)
        setLiked(false)
      } else {
        const result = await sendLike(profile.id)
        setLiked(true)
        if (result.isMatch) {
          setShowMatchModal(true)
          setTimeout(() => {
            setShowMatchModal(false)
            router.push("/matches")
          }, 2000)
        }
      }
      router.refresh()
    } catch (error) {
      console.error("Error handling like:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <OptimizedImage
          src={mainImage}
          alt={profile.nickname || "プロフィール画像"}
          fill
          containerClassName="relative h-48 bg-gradient-to-br from-pink-100 to-purple-100"
          className="object-cover"
        />

        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900">{profile.nickname}</h3>
              {profile.is_verified && <CheckCircle2 className="h-5 w-5 text-blue-500" title="本人確認済み" />}
            </div>
            {age && <span className="text-sm text-gray-600">{age}歳</span>}
          </div>

          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            {profile.prefecture || "未設定"}
            <span>•</span>
            {genderDisplay}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {profile.user_type === "障がいのある方" && (
              <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                障がいのある方
              </Badge>
            )}
            {profile.user_type === "サポーター" && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                サポーター
              </Badge>
            )}
            {disabilityTypes.length > 0 &&
              disabilityTypes.slice(0, 2).map((type: string) => (
                <Badge key={type} variant="secondary" className="bg-green-100 text-green-800">
                  {type}
                </Badge>
              ))}
            {disabilityTypes.length > 2 && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                +{disabilityTypes.length - 2}
              </Badge>
            )}
          </div>

          {profile.bio && <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">{profile.bio}</p>}

          <div className="flex gap-2">
            <Button variant={liked ? "default" : "outline"} className="flex-1" onClick={handleLike} disabled={loading}>
              <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {liked ? "いいね済み" : "いいね"}
            </Button>
            <Link href={`/profile/${profile.id}`} className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                詳細
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {showMatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary fill-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">マッチング成立！</h3>
                <p className="text-muted-foreground">
                  {profile.nickname}さんとマッチングしました。メッセージを送ってみましょう！
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
