"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin,
  Calendar,
  User,
  Home,
  Heart,
  Users,
  Briefcase,
  GraduationCap,
  Cigarette,
  Wine,
  CheckCircle,
  Ruler,
  Tag,
} from "lucide-react"
import { OptimizedImage } from "@/components/ui/optimized-image"

interface ProfileViewProps {
  profile: {
    nickname: string
    birth_date?: string
    gender?: string
    prefecture?: string
    city?: string
    hometown?: string
    favorite_areas?: string
    bio?: string
    user_type?: string
    profile_images?: string[] | string
    profile_image_url?: string
    profile_image_1?: string
    profile_image_2?: string
    profile_image_3?: string
    favorite_city?: string
    living_situation?: string
    family_relationship?: string
    can_go_out_alone?: boolean
    disability_details?: string
    chronic_illness_details?: string
    support_experience?: string
    welfare_equipment?: boolean
    employment_type?: string
    employment_status?: string
    occupation?: string
    annual_income?: string
    has_disability?: boolean
    disability_type?: string[]
    chronic_illness?: boolean
    supporter_message?: string
    education?: string
    smoking?: string
    drinking?: string
    body_type?: string
    mbti?: string
    purpose?: string | string[]
    marital_status?: string
    children_status?: string
    independence_level?: string
    is_verified?: boolean
    height?: number | string
    tags?: string[]
  }
  profileTags?: string[]
  tags?: { tag_text: string; tag_color: string; tag_category: string }[]
}

export function ProfileView({ profile, profileTags = [], tags = [] }: ProfileViewProps) {
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const age = profile.birth_date ? calculateAge(profile.birth_date) : undefined

  const getInitials = (name: string) => {
    return name.slice(0, 2)
  }

  const getProfileImageUrl = () => {
    if (profile.profile_image_1) {
      return profile.profile_image_1
    }
    if (profile.profile_images) {
      if (Array.isArray(profile.profile_images)) {
        return profile.profile_images[0]
      }
      if (typeof profile.profile_images === "string") {
        try {
          const parsed = JSON.parse(profile.profile_images)
          return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null
        } catch {
          return null
        }
      }
    }
    return profile.profile_image_url || null
  }

  const getSubImages = () => {
    const images: string[] = []
    if (profile.profile_image_2) images.push(profile.profile_image_2)
    if (profile.profile_image_3) images.push(profile.profile_image_3)
    return images
  }

  const profileImageUrl = getProfileImageUrl()
  const subImages = getSubImages()

  const relationshipTags = tags.filter((t) => t.tag_category === "relationship")
  const interestTags = tags.filter((t) => t.tag_category === "interests")
  const disabilityTags = tags.filter((t) => t.tag_category === "disability")

  const genderLabel = profile.gender === "male" ? "男性" : profile.gender === "female" ? "女性" : "その他"

  const userTypeLabel =
    profile.user_type === "person_with_disability"
      ? "障がいのある方"
      : profile.user_type === "chronic_illness"
        ? "難病の方"
        : profile.user_type === "supporter"
          ? "サポーター"
          : undefined

  const isSupporter = profile.user_type === "supporter"

  const livingSituationLabel =
    profile.living_situation === "alone"
      ? "一人暮らし"
      : profile.living_situation === "with_family"
        ? "家族と同居"
        : profile.living_situation === "with_partner"
          ? "パートナーと同居"
          : profile.living_situation === "group_home"
            ? "グループホーム"
            : profile.living_situation === "facility"
              ? "施設"
              : profile.living_situation === "other"
                ? "その他"
                : profile.living_situation || undefined

  const employmentTypeLabel =
    profile.employment_type === "full_time"
      ? "正社員"
      : profile.employment_type === "part_time"
        ? "パート・アルバイト"
        : profile.employment_type === "contract"
          ? "契約社員・派遣社員"
          : profile.employment_type === "self_employed"
            ? "自営業・フリーランス"
            : profile.employment_type === "unemployed"
              ? "無職"
              : profile.employment_type === "student"
                ? "学生"
                : profile.employment_type === "retired"
                  ? "退職"
                  : profile.employment_type === "other"
                    ? "その他"
                    : profile.employment_type || undefined

  const annualIncomeLabel =
    profile.annual_income === "under_2m"
      ? "200万円未満"
      : profile.annual_income === "2m_4m"
        ? "200万円〜400万円未満"
        : profile.annual_income === "4m_6m"
          ? "400万円〜600万円未満"
          : profile.annual_income === "6m_8m"
            ? "600万円〜800万円未満"
            : profile.annual_income === "8m_10m"
              ? "800万円〜1,000万円未満"
              : profile.annual_income === "over_10m"
                ? "1,000万円以上"
                : profile.annual_income === "prefer_not_to_say"
                  ? "回答しない"
                  : profile.annual_income || undefined

  const parseJsonField = (field: string | undefined) => {
    if (!field) return null
    try {
      return JSON.parse(field)
    } catch {
      return null
    }
  }

  const disabilityDetails = parseJsonField(profile.disability_details)
  const chronicIllnessDetails = parseJsonField(profile.chronic_illness_details)
  const supportExperience = parseJsonField(profile.support_experience)

  const favoriteAreas = profile.favorite_areas
    ? profile.favorite_areas
        .split(",")
        .map((area) => area.trim())
        .join("、")
    : undefined

  const drinkingLabel =
    profile.drinking === "true" || profile.drinking === true
      ? "飲む"
      : profile.drinking === "false" || profile.drinking === false
        ? "飲まない"
        : profile.drinking === "sometimes"
          ? "たまに飲む"
          : profile.drinking || undefined

  const smokingLabel =
    profile.smoking === "true" || profile.smoking === true
      ? "吸う"
      : profile.smoking === "false" || profile.smoking === false
        ? "吸わない"
        : profile.smoking === "sometimes"
          ? "たまに吸う"
          : profile.smoking || undefined

  const displayTags = profileTags.length > 0 ? profileTags : profile.tags || []

  const purposeArray = Array.isArray(profile.purpose) ? profile.purpose : profile.purpose ? [profile.purpose] : []

  return (
    <div className="space-y-6">
      {/* ヘッダー部分 */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-pink-400 to-blue-400" />
        <div className="relative px-6 pb-6">
          <Avatar className="absolute -top-16 h-32 w-32 border-4 border-white">
            <AvatarImage src={profileImageUrl || "/placeholder.svg"} alt={profile.nickname} />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-blue-400 text-2xl text-white">
              {getInitials(profile.nickname)}
            </AvatarFallback>
          </Avatar>

          <div className="ml-36 pt-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{profile.nickname}</h1>
              {profile.is_verified && (
                <Badge className="bg-blue-500 text-white">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  認証済み
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
              {age && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {age}歳
                </div>
              )}
              {profile.gender && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {genderLabel}
                </div>
              )}
              {profile.prefecture && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.prefecture}
                  {profile.city && ` / ${profile.city}`}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {subImages.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">その他の写真</h2>
          <div className="flex gap-4 overflow-x-auto">
            {subImages.map((img, index) => (
              <OptimizedImage
                key={index}
                src={img}
                alt={`${profile.nickname}の写真${index + 2}`}
                width={128}
                height={128}
                containerClassName="h-32 w-32 flex-shrink-0 rounded-lg"
                className="rounded-lg object-cover"
              />
            ))}
          </div>
        </Card>
      )}

      {displayTags.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Tag className="h-5 w-5" />
            興味・関心タグ
          </h2>
          <div className="flex flex-wrap gap-2">
            {displayTags.map((tag, index) => (
              <Badge key={index} className="bg-pink-100 text-pink-800 border-pink-300 px-3 py-1">
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* 旧タグシステム（sasaeai_profile_tagsテーブル）のタグ表示 */}
      {tags.length > 0 && displayTags.length === 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">設定中のタグ</h2>
          <div className="space-y-4">
            {relationshipTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {relationshipTags.map((tag, index) => (
                  <Badge key={index} className="bg-pink-100 text-pink-800 border-pink-300 px-3 py-1">
                    {tag.tag_text}
                  </Badge>
                ))}
              </div>
            )}
            {interestTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interestTags.map((tag, index) => (
                  <Badge key={index} className="bg-orange-100 text-orange-800 border-orange-300 px-3 py-1">
                    {tag.tag_text}
                  </Badge>
                ))}
              </div>
            )}
            {disabilityTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {disabilityTags.map((tag, index) => (
                  <Badge key={index} className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                    {tag.tag_text}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 基本情報 */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {userTypeLabel && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">種別:</span>
              <Badge variant="secondary">{userTypeLabel}</Badge>
            </div>
          )}
          {profile.prefecture && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">居住地:</span>
              <span className="font-medium">
                {profile.prefecture}
                {profile.city && ` / ${profile.city}`}
              </span>
            </div>
          )}
          {profile.height && (
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">身長:</span>
              <span className="font-medium">{profile.height}cm</span>
            </div>
          )}
          {purposeArray.length > 0 && (
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">目的:</span>
              <span className="font-medium">{purposeArray.join("、")}</span>
            </div>
          )}
          {profile.hometown && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">出身地:</span>
              <span className="font-medium">{profile.hometown}</span>
            </div>
          )}
          {favoriteAreas && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">遊びに行く街:</span>
              <span className="font-medium">{favoriteAreas}</span>
            </div>
          )}
          {profile.favorite_city && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">好きな街:</span>
              <span className="font-medium">{profile.favorite_city}</span>
            </div>
          )}
          {profile.body_type && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">体型:</span>
              <span className="font-medium">{profile.body_type}</span>
            </div>
          )}
          {profile.mbti && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">MBTI:</span>
              <span className="font-medium">{profile.mbti}</span>
            </div>
          )}
          {profile.marital_status && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">婚姻状況:</span>
              <span className="font-medium">{profile.marital_status}</span>
            </div>
          )}
          {profile.children_status && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">子供:</span>
              <span className="font-medium">{profile.children_status}</span>
            </div>
          )}
          {profile.education && (
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">学歴:</span>
              <span className="font-medium">{profile.education}</span>
            </div>
          )}
          {profile.smoking && (
            <div className="flex items-center gap-2">
              <Cigarette className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">喫煙:</span>
              <span className="font-medium">{smokingLabel}</span>
            </div>
          )}
          {profile.drinking && (
            <div className="flex items-center gap-2">
              <Wine className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">飲酒:</span>
              <span className="font-medium">{drinkingLabel}</span>
            </div>
          )}
        </div>
      </Card>

      {/* 就労情報 */}
      {(profile.employment_status || employmentTypeLabel || profile.occupation || annualIncomeLabel) && (
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Briefcase className="h-5 w-5" />
            就労情報
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {profile.employment_status && (
              <div>
                <span className="text-sm text-gray-600">就労状況:</span>
                <p className="font-medium">{profile.employment_status}</p>
              </div>
            )}
            {employmentTypeLabel && (
              <div>
                <span className="text-sm text-gray-600">就労形態:</span>
                <p className="font-medium">{employmentTypeLabel}</p>
              </div>
            )}
            {profile.occupation && (
              <div>
                <span className="text-sm text-gray-600">職業:</span>
                <p className="font-medium">{profile.occupation}</p>
              </div>
            )}
            {annualIncomeLabel && (
              <div>
                <span className="text-sm text-gray-600">年収:</span>
                <p className="font-medium">{annualIncomeLabel}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 生活状況 */}
      {(livingSituationLabel ||
        profile.family_relationship ||
        (!isSupporter && profile.can_go_out_alone !== undefined) ||
        (!isSupporter && profile.independence_level)) && (
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Home className="h-5 w-5" />
            生活状況
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {livingSituationLabel && (
              <div>
                <span className="text-sm text-gray-600">住まい:</span>
                <p className="font-medium">{livingSituationLabel}</p>
              </div>
            )}
            {profile.family_relationship && (
              <div>
                <span className="text-sm text-gray-600">家族関係:</span>
                <p className="font-medium">{profile.family_relationship}</p>
              </div>
            )}
            {!isSupporter && profile.can_go_out_alone !== undefined && (
              <div>
                <span className="text-sm text-gray-600">外出:</span>
                <p className="font-medium">{profile.can_go_out_alone ? "一人で外出できる" : "サポートが必要"}</p>
              </div>
            )}
            {!isSupporter && profile.independence_level && (
              <div>
                <span className="text-sm text-gray-600">自立度:</span>
                <p className="font-medium">{profile.independence_level}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* サポーターメッセージ */}
      {isSupporter && profile.supporter_message && (
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Heart className="h-5 w-5" />
            サポーターメッセージ
          </h2>
          <p className="text-gray-600 whitespace-pre-wrap">{profile.supporter_message}</p>
        </Card>
      )}

      {/* 自己紹介 */}
      {profile.bio && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">自己紹介</h2>
          <p className="whitespace-pre-wrap text-gray-600">{profile.bio}</p>
        </Card>
      )}
    </div>
  )
}
