"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { TABLES } from "@/lib/supabase/table-names"
import { Upload, X, GripVertical } from "lucide-react"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BODY_TYPES,
  SMOKING_STATUS,
  MARITAL_STATUS,
  CHILDREN_STATUS,
  EMPLOYMENT_STATUS,
  ANNUAL_INCOME,
  TAG_OPTIONS,
  USER_TYPES,
  MBTI_TYPES,
  MBTI_DESCRIPTIONS,
  INDEPENDENCE_LEVEL,
} from "@/lib/constants/profile-options"
import { LIVING_SITUATION_OPTIONS } from "@/lib/constants/options"
import { notifyAdminsNewVerificationRequest } from "@/lib/actions/notifications"
import { ButtonSelect } from "@/components/ui/button-select"
import { LocationSelector } from "@/components/profile/location-selector"
import { IdVerificationUpload } from "@/components/profile/id-verification-upload"

interface ProfileEditFormProps {
  profile: any
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingVerificationImages, setUploadingVerificationImages] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseProfileImages = (images: any): string[] => {
    if (!images) return []
    if (Array.isArray(images)) return images
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images)
        return Array.isArray(parsed) ? parsed : []
      } catch (e) {
        return []
      }
    }
    return []
  }

  // 基本情報
  const [nickname, setNickname] = useState(profile.nickname || "")
  const [birthDate, setBirthDate] = useState(profile.birth_date || "")
  const [gender, setGender] = useState(profile.gender || "")
  const [preferredGender, setPreferredGender] = useState<string[]>(profile.preferred_gender || [])
  const [purpose, setPurpose] = useState<string[]>(profile.purpose || [])
  const [prefecture, setPrefecture] = useState(profile.prefecture || "")
  const [regionalArea, setRegionalArea] = useState(profile.city || "")
  const [hangoutAreas, setHangoutAreas] = useState(profile.hangout_areas || "")
  const [height, setHeight] = useState(profile.height?.toString() || "")
  const [bodyType, setBodyType] = useState(profile.body_type || "")
  const [mbti, setMbti] = useState(profile.mbti || "")
  const [bio, setBio] = useState(profile.bio || "")
  const [profileImages, setProfileImages] = useState<string[]>(parseProfileImages(profile.profile_images))
  const [isSecretMode, setIsSecretMode] = useState(profile.is_secret_mode || false)
  const [favoriteCity, setFavoriteCity] = useState(profile.favorite_city || "")
  const [userType, setUserType] = useState(profile.user_type || "")
  const [favoriteAreas, setFavoriteAreas] = useState<string[]>(profile.favorite_areas?.split(",") || [])
  const [hometown, setHometown] = useState(profile.hometown || "")

  // 障がい情報
  const [hasDisability, setHasDisability] = useState(profile.has_disability || false)
  const [disabilityType, setDisabilityType] = useState<string[]>(profile.disability_type || [])
  const [disabilityDetails, setDisabilityDetails] = useState(profile.disability_details || "")
  const [hasIntractableDisease, setHasIntractableDisease] = useState(!!profile.chronic_illness)
  const [intractableDiseaseDetails, setIntractableDiseaseDetails] = useState(profile.chronic_illness || "")
  const [hasOtherIllness, setHasOtherIllness] = useState(!!profile.other_illness)
  const [otherIllnessDetails, setOtherIllnessDetails] = useState(profile.other_illness || "")

  // 仕事・生活
  const [employmentStatus, setEmploymentStatus] = useState(profile.employment_status || "")
  const [employmentType, setEmploymentType] = useState(profile.employment_type || "")
  const [disabilityPension, setDisabilityPension] = useState(profile.disability_pension || false)
  const [welfareBenefits, setWelfareBenefits] = useState(profile.welfare_benefits || false)
  const [annualIncome, setAnnualIncome] = useState(profile.annual_income || "")
  const [livingSituation, setLivingSituation] = useState(profile.living_situation || "")
  const [familyRelationship, setFamilyRelationship] = useState(profile.family_relationship || "")
  const [maritalStatus, setMaritalStatus] = useState(profile.marital_status || "")
  const [hasChildren, setHasChildren] = useState(profile.has_children || "")
  const [independenceLevel, setIndependenceLevel] = useState(profile.independence_level || "")
  const [canGoOutAlone, setCanGoOutAlone] = useState(profile.can_go_out_alone !== false)
  const [drinksAlcohol, setDrinksAlcohol] = useState(profile.drinking || false)
  const [smokes, setSmokes] = useState(profile.smoking || "")
  const [gambles, setGambles] = useState(profile.gambles || false)

  // タグ
  const [selectedTags, setSelectedTags] = useState<string[]>(profile.tags || [])

  // 本人確認
  const [idVerificationImageUrl, setIdVerificationImageUrl] = useState(profile.id_verification_image_url || "")
  const [selfieVerificationImageUrl, setSelfieVerificationImageUrl] = useState(
    profile.selfie_verification_image_url || "",
  )
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [supporterMessage, setSupporterMessage] = useState(profile.supporter_message || "")

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const MAX_FILE_SIZE = 10 * 1024 * 1024
    const oversizedFiles = Array.from(files).filter((file) => file.size > MAX_FILE_SIZE)

    if (oversizedFiles.length > 0) {
      alert("画像サイズは10MB以下にしてください")
      return
    }

    const currentImageCount = profileImages.length
    const availableSlots = 3 - currentImageCount

    if (availableSlots <= 0) {
      alert("プロフィール画像は最大3枚までです")
      return
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots)
    setUploadingImages(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "profile")

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000)

        try {
          const response = await fetch("/api/profile/upload-image", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error("画像のアップロードに失敗しました")
          }

          const data = await response.json()
          uploadedUrls.push(data.url)
        } catch (error: any) {
          clearTimeout(timeoutId)
          if (error.name === "AbortError") {
            throw new Error("画像のアップロードがタイムアウトしました。もう一度お試しください。")
          }
          throw error
        }
      }

      setProfileImages([...profileImages, ...uploadedUrls])
    } catch (error: any) {
      console.error("Error uploading images:", error)
      alert(error.message || "画像のアップロードに失敗しました")
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setProfileImages(profileImages.filter((_, i) => i !== index))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...profileImages]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    setProfileImages(newImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (uploadingVerificationImages) {
      alert("画像のアップロードが完了するまでお待ちください")
      return
    }

    setLoading(true)

    const hadVerificationBefore = !!profile.id_verification_image_url
    const hasNewVerification =
      (idVerificationImageUrl && idVerificationImageUrl !== profile.id_verification_image_url) ||
      (selfieVerificationImageUrl && selfieVerificationImageUrl !== profile.selfie_verification_image_url)

    try {
      const profileData: Record<string, any> = {
        nickname,
        birth_date: birthDate || undefined,
        gender,
        bio: bio || undefined,
        profile_images: profileImages,
        is_secret_mode: isSecretMode,
        prefecture,
        city: regionalArea || undefined,
        favorite_city: favoriteCity || undefined,
        user_type: userType || undefined,
        has_disability: hasDisability,
        disability_type: disabilityType.length > 0 ? disabilityType : [],
        disability_details: disabilityDetails || undefined,
        chronic_illness: hasIntractableDisease ? intractableDiseaseDetails : null,
        other_illness: hasOtherIllness ? otherIllnessDetails : null,
        can_go_out_alone: canGoOutAlone,
        supporter_message: supporterMessage || undefined,
        id_verification_image_url: idVerificationImageUrl || undefined,
        selfie_verification_image_url: selfieVerificationImageUrl || undefined,
        updated_at: new Date().toISOString(),
        height: height ? Number.parseInt(height, 10) : null,
        body_type: bodyType || null,
        mbti: mbti || null,
        purpose: purpose.length > 0 ? purpose : [],
        favorite_areas: favoriteAreas.length > 0 ? favoriteAreas.join(",") : null,
        hometown: hometown || null,
        tags: selectedTags.length > 0 ? selectedTags : [],
        preferred_gender: preferredGender.length > 0 ? preferredGender : [],
        hangout_areas: hangoutAreas || null,
        employment_status: employmentStatus || null,
        employment_type: employmentType || null,
        annual_income: annualIncome || null,
        marital_status: maritalStatus || null,
        has_children: hasChildren || null,
        smoking: smokes || null,
        drinking: drinksAlcohol,
        independence_level: independenceLevel || null,
      }

      if (livingSituation && livingSituation.trim() !== "") {
        profileData.living_situation = livingSituation
      }

      const { error: profileError } = await supabase.from(TABLES.PROFILES).update(profileData).eq("id", profile.id)

      if (profileError) {
        console.error("Profile update error:", profileError)
        throw profileError
      }

      if (hasNewVerification) {
        await notifyAdminsNewVerificationRequest(profile.id, nickname)
      }

      alert("プロフィールを更新しました")
      router.push(`/profile/${profile.id}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setError(`プロフィールの更新に失敗しました: ${error.message || "不明なエラー"}`)
    } finally {
      setLoading(false)
    }
  }

  const genderOptions = [
    { value: "male", label: "男性" },
    { value: "female", label: "女性" },
    { value: "other", label: "LGBTQ当事者" },
  ]

  const userTypeOptions = USER_TYPES.map((t) => ({ value: t.value, label: t.label }))

  const bodyTypeOptions = BODY_TYPES.map((t) => ({ value: t, label: t }))

  const mbtiOptions = MBTI_TYPES.map((t) => ({
    value: t,
    label: t,
    description: MBTI_DESCRIPTIONS[t] || "",
  }))

  const purposeOptions = TAG_OPTIONS.purpose.tags.map((t) => ({ value: t, label: t }))

  const employmentStatusOptions = EMPLOYMENT_STATUS.map((s) => ({ value: s, label: s }))

  const employmentTypeOptions = TAG_OPTIONS.employmentType.tags.map((t) => ({ value: t, label: t }))

  const annualIncomeOptions = ANNUAL_INCOME.map((i) => ({ value: i, label: `${i}万円` }))

  const livingSituationOptions = LIVING_SITUATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))

  const maritalStatusOptions = MARITAL_STATUS.map((s) => ({ value: s, label: s }))

  const childrenOptions = CHILDREN_STATUS.map((s) => ({ value: s, label: s }))

  const independenceLevelOptions = INDEPENDENCE_LEVEL.map((l) => ({ value: l, label: l }))

  const smokingOptions = SMOKING_STATUS.map((s) => ({ value: s, label: s }))

  const drinkingOptions = [
    { value: "true", label: "飲む" },
    { value: "false", label: "飲まない" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* プロフィール画像 */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Label>プロフィール画像（最大3枚）</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              画像をドラッグして並び替えができます。1枚目がメイン画像として表示されます。
            </p>
            <div className="mt-2 grid grid-cols-3 gap-4">
              {profileImages.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 cursor-move transition-all ${
                    draggedIndex === index
                      ? "border-pink-500 scale-105 shadow-lg"
                      : "border-gray-200 hover:border-pink-300"
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="absolute left-2 top-2 z-10 rounded-full bg-white/90 p-1.5 shadow-lg border border-gray-200">
                    <GripVertical className="h-5 w-5 text-gray-700" />
                  </div>
                  {index === 0 && (
                    <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-pink-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                      メイン
                    </div>
                  )}
                  <Image
                    src={url || "/placeholder.svg"}
                    alt={`プロフィール画像${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-2 top-2 z-10 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 shadow-lg"
                    aria-label="画像を削除"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {profileImages.length < 3 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">画像を追加</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {uploadingImages && <p className="mt-2 text-sm text-blue-600">アップロード中...</p>}
          </div>

          {/* シークレットモード */}
          <div className="space-y-2 rounded-lg border-2 border-gray-300 bg-gray-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">シークレットモード</h3>
                  {isSecretMode ? (
                    <span className="inline-flex items-center rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white">
                      オン
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border-2 border-gray-400 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                      オフ
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  検索結果に表示されません。あなたがいいねした相手だけがプロフィールを見ることができます
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSecretMode(!isSecretMode)}
                className={`min-w-[120px] rounded-lg px-6 py-3 text-base font-semibold transition-all ${
                  isSecretMode
                    ? "bg-pink-500 text-white hover:bg-pink-600"
                    : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {isSecretMode ? "オフにする" : "オンにする"}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="nickname">
              ニックネーム <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例: はっしー"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="bio">自己紹介</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="自己紹介を入力してください"
              rows={5}
              className="mt-1"
            />
            <p className="mt-1 text-sm text-gray-500">自己PR文は詳しく書くとマッチ率が上がります</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="birthDate">生年月日</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="height">身長 (cm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="165"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>
              性別 <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2">
              <ButtonSelect
                options={genderOptions}
                value={gender}
                onChange={(v) => setGender(v as string)}
                columns={3}
                size="md"
              />
            </div>
          </div>

          <div>
            <Label>ユーザー種別</Label>
            <p className="text-sm text-gray-500 mt-1">サポーター: 支援する側 / チャレンジャー: 支援を受ける側</p>
            <div className="mt-2">
              <ButtonSelect
                options={[
                  { value: "supporter", label: "サポーター", description: "支援する側" },
                  { value: "challenger", label: "チャレンジャー", description: "支援を受ける側" },
                ]}
                value={userType}
                onChange={(v) => setUserType(v as string)}
                columns={2}
                size="md"
              />
            </div>
          </div>

          <div>
            <Label>お相手の性別の希望（複数選択可）</Label>
            <div className="mt-2">
              <ButtonSelect
                options={genderOptions}
                value={preferredGender}
                onChange={(v) => setPreferredGender(v as string[])}
                multiple
                columns={3}
                size="md"
              />
            </div>
          </div>

          <div>
            <Label>主な目的（複数選択可）</Label>
            <div className="mt-2">
              <ButtonSelect
                options={purposeOptions}
                value={purpose}
                onChange={(v) => setPurpose(v as string[])}
                multiple
                columns={3}
                size="md"
              />
            </div>
          </div>

          <div>
            <Label>MBTI性格診断</Label>
            <p className="text-sm text-gray-500 mt-1">16の性格タイプから選択してください</p>
            <div className="mt-2">
              <ButtonSelect
                options={mbtiOptions}
                value={mbti}
                onChange={(v) => setMbti(v as string)}
                columns={4}
                size="sm"
              />
            </div>
          </div>

          <div>
            <Label>体型</Label>
            <div className="mt-2">
              <ButtonSelect
                options={bodyTypeOptions}
                value={bodyType}
                onChange={(v) => setBodyType(v as string)}
                columns={4}
                size="sm"
              />
            </div>
          </div>

          <div>
            <Label>居住地</Label>
            <div className="mt-2">
              <LocationSelector
                prefecture={prefecture}
                area={regionalArea}
                onPrefectureChange={setPrefecture}
                onAreaChange={setRegionalArea}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="hangoutAreas">遊びに行く街</Label>
            <Input
              id="hangoutAreas"
              value={hangoutAreas}
              onChange={(e) => setHangoutAreas(e.target.value)}
              placeholder="例: つくば、水戸"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="favoriteCity">好きな街</Label>
            <Input
              id="favoriteCity"
              value={favoriteCity}
              onChange={(e) => setFavoriteCity(e.target.value)}
              placeholder="例: 渋谷、新宿、梅田など"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="hometown">出身地</Label>
            <Input
              id="hometown"
              value={hometown}
              onChange={(e) => setHometown(e.target.value)}
              placeholder="例: 東京都"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* 障がい・難病情報 */}
      <Card>
        <CardHeader>
          <CardTitle>障がい・難病情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 障がい */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasDisability"
                checked={hasDisability}
                onCheckedChange={(checked) => setHasDisability(checked as boolean)}
              />
              <Label htmlFor="hasDisability" className="font-semibold">
                障がい
              </Label>
            </div>

            {hasDisability && (
              <div className="ml-6 space-y-4">
                <div>
                  <Label>障がいの種類（複数選択可）</Label>
                  <div className="mt-2">
                    <ButtonSelect
                      options={[
                        { value: "精神障がい", label: "精神障がい" },
                        { value: "知的障がい", label: "知的障がい" },
                        { value: "身体障がい", label: "身体障がい" },
                        { value: "発達障がい", label: "発達障がい" },
                        { value: "その他", label: "その他" },
                      ]}
                      value={disabilityType}
                      onChange={(v) => setDisabilityType(v as string[])}
                      multiple
                      columns={3}
                      size="sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="disabilityDetails">障がいの詳細</Label>
                  <Textarea
                    id="disabilityDetails"
                    value={disabilityDetails}
                    onChange={(e) => setDisabilityDetails(e.target.value)}
                    placeholder="詳細を記入してください"
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasIntractableDisease"
                checked={hasIntractableDisease}
                onCheckedChange={(checked) => {
                  setHasIntractableDisease(checked as boolean)
                  if (!checked) setIntractableDiseaseDetails("")
                }}
              />
              <Label htmlFor="hasIntractableDisease" className="font-semibold">
                指定難病
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              厚生労働省が指定する難病（パーキンソン病、潰瘍性大腸炎、もやもや病など）
            </p>

            {hasIntractableDisease && (
              <div className="ml-6">
                <Label htmlFor="intractableDiseaseDetails">指定難病の詳細</Label>
                <Input
                  id="intractableDiseaseDetails"
                  value={intractableDiseaseDetails}
                  onChange={(e) => setIntractableDiseaseDetails(e.target.value)}
                  placeholder="例: もやもや病、パーキンソン病"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasOtherIllness"
                checked={hasOtherIllness}
                onCheckedChange={(checked) => {
                  setHasOtherIllness(checked as boolean)
                  if (!checked) setOtherIllnessDetails("")
                }}
              />
              <Label htmlFor="hasOtherIllness" className="font-semibold">
                指定難病以外の持病
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              糖尿病、高血圧、喘息、アレルギーなど、継続的な治療が必要な疾患
            </p>

            {hasOtherIllness && (
              <div className="ml-6">
                <Label htmlFor="otherIllnessDetails">持病の詳細</Label>
                <Input
                  id="otherIllnessDetails"
                  value={otherIllnessDetails}
                  onChange={(e) => setOtherIllnessDetails(e.target.value)}
                  placeholder="例: 糖尿病、高血圧"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 仕事・生活情報 */}
      <Card>
        <CardHeader>
          <CardTitle>仕事・生活情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>就労状況</Label>
            <div className="mt-2">
              <ButtonSelect
                options={employmentStatusOptions}
                value={employmentStatus}
                onChange={(v) => setEmploymentStatus(v as string)}
                columns={4}
                size="sm"
              />
            </div>
          </div>

          <div>
            <Label>雇用形態</Label>
            <div className="mt-2">
              <ButtonSelect
                options={employmentTypeOptions}
                value={employmentType}
                onChange={(v) => setEmploymentType(v as string)}
                columns={3}
                size="sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disabilityPension"
                checked={disabilityPension}
                onCheckedChange={(checked) => setDisabilityPension(checked as boolean)}
              />
              <Label htmlFor="disabilityPension">障害年金を受給している</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="welfareBenefits"
                checked={welfareBenefits}
                onCheckedChange={(checked) => setWelfareBenefits(checked as boolean)}
              />
              <Label htmlFor="welfareBenefits">福祉給付金を受給している</Label>
            </div>
          </div>

          <div>
            <Label>年間収入</Label>
            <div className="mt-2">
              <ButtonSelect
                options={annualIncomeOptions}
                value={annualIncome}
                onChange={(v) => setAnnualIncome(v as string)}
                columns={4}
                size="sm"
              />
            </div>
          </div>

          <div>
            <Label>生活状況</Label>
            <div className="mt-2">
              <ButtonSelect
                options={livingSituationOptions}
                value={livingSituation}
                onChange={(v) => setLivingSituation(v as string)}
                columns={3}
                size="sm"
              />
            </div>
          </div>

          <div>
            <Label>婚姻状況</Label>
            <div className="mt-2">
              <ButtonSelect
                options={maritalStatusOptions}
                value={maritalStatus}
                onChange={(v) => setMaritalStatus(v as string)}
                columns={3}
                size="md"
              />
            </div>
          </div>

          <div>
            <Label>子供</Label>
            <div className="mt-2">
              <ButtonSelect
                options={childrenOptions}
                value={hasChildren}
                onChange={(v) => setHasChildren(v as string)}
                columns={3}
                size="md"
              />
            </div>
          </div>

          <div>
            <Label>自立度レベル</Label>
            <div className="mt-2">
              <ButtonSelect
                options={independenceLevelOptions}
                value={independenceLevel}
                onChange={(v) => setIndependenceLevel(v as string)}
                columns={2}
                size="sm"
              />
            </div>
          </div>

          <div>
            <Label>喫煙</Label>
            <div className="mt-2">
              <ButtonSelect
                options={smokingOptions}
                value={smokes}
                onChange={(v) => setSmokes(v as string)}
                columns={2}
                size="md"
              />
            </div>
          </div>

          <div>
            <Label>飲酒</Label>
            <div className="mt-2">
              <ButtonSelect
                options={drinkingOptions}
                value={drinksAlcohol ? "true" : "false"}
                onChange={(v) => setDrinksAlcohol(v === "true")}
                columns={2}
                size="md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* タグ */}
      <Card>
        <CardHeader>
          <CardTitle>タグ</CardTitle>
          <p className="text-sm text-gray-500">あなたを表すタグを選択してください（複数選択可）</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(TAG_OPTIONS).map(([key, category]) => (
            <div key={key}>
              <Label className="text-base font-semibold">{category.label}</Label>
              <div className="mt-2">
                <ButtonSelect
                  options={category.tags.map((t) => ({ value: t, label: t }))}
                  value={selectedTags.filter((t) => category.tags.includes(t))}
                  onChange={(v) => {
                    const otherTags = selectedTags.filter((t) => !category.tags.includes(t))
                    setSelectedTags([...otherTags, ...(v as string[])])
                  }}
                  multiple
                  columns={3}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* サポーターメッセージ（サポーターの場合） */}
      {userType === "supporter" && (
        <Card>
          <CardHeader>
            <CardTitle>サポーターメッセージ</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={supporterMessage}
              onChange={(e) => setSupporterMessage(e.target.value)}
              placeholder="チャレンジャーの方へのメッセージを入力してください"
              rows={4}
            />
          </CardContent>
        </Card>
      )}

      {/* 本人確認書類 */}
      <Card>
        <CardHeader>
          <CardTitle>本人確認書類</CardTitle>
        </CardHeader>
        <CardContent>
          <IdVerificationUpload
            idVerificationImageUrl={idVerificationImageUrl}
            selfieVerificationImageUrl={selfieVerificationImageUrl}
            onIdVerificationImageChange={setIdVerificationImageUrl}
            onSelfieVerificationImageChange={setSelfieVerificationImageUrl}
            onUploadingChange={setUploadingVerificationImages}
          />
        </CardContent>
      </Card>

      {/* 送信ボタン */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
        <Button type="submit" disabled={loading || uploadingImages || uploadingVerificationImages}>
          {loading ? "更新中..." : "プロフィールを更新"}
        </Button>
      </div>
    </form>
  )
}
