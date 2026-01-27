"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Heart, Briefcase, MapPin, Check, Upload, X, Camera, Shield, AlertTriangle } from "lucide-react"
import Image from "next/image"
import {
  USER_TYPES,
  BODY_TYPES,
  SMOKING_STATUS,
  MBTI_TYPES,
  MBTI_DESCRIPTIONS,
  MARITAL_STATUS,
  EMPLOYMENT_STATUS,
  INDEPENDENCE_LEVEL,
} from "@/lib/constants/profile-options"
import { LIVING_SITUATION_OPTIONS } from "@/lib/constants/options"
import { ButtonSelect, ButtonSelectMulti } from "@/components/ui/button-select"
import { LocationSelector } from "@/components/profile/location-selector"
import { IdVerificationUpload } from "@/components/profile/id-verification-upload"
import { TABLES } from "@/lib/supabase/table-names"

interface ProfileSetupFormProps {
  userId: string
  userEmail: string
}

const availableTags = {
  relationship: [
    "友達も恋人も探し中",
    "良い人がいれば交際したい",
    "友情結婚希望",
    "まずは友達から",
    "真剣な出会い希望",
    "性的なことが苦手",
    "コミュ力低い",
  ],
  interests: [
    "食べることが好き",
    "韓国料理",
    "寿司",
    "邦楽",
    "ROCK",
    "SPY×FAMILY",
    "映画鑑賞",
    "読書",
    "アニメ",
    "ゲーム",
    "散歩",
    "カラオケ",
  ],
  disability: [
    "健常者です",
    "理解ある健常者",
    "グレーゾーンです",
    "障害があります",
    "障害者手帳を持っています",
    "統合失調症",
    "双極性障害",
    "うつ病",
    "ADHD",
    "ASD",
    "難病、難病以外の持病がある",
    "きょうだい児です",
    "持病があります",
  ],
}

const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "LGBTQ当事者" },
]

const PREFERRED_GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "LGBTQ当事者" },
]

const DISABILITY_TYPES = ["精神障がい", "知的障がい", "身体障がい", "発達障がい", "その他"]

const DRINKING_OPTIONS = [
  { value: "yes", label: "飲む" },
  { value: "sometimes", label: "たまに飲む" },
  { value: "no", label: "飲まない" },
]

const EMPLOYMENT_TYPE = [
  "正社員",
  "契約社員",
  "派遣社員",
  "パート・アルバイト",
  "自営その他",
  "A型事業所",
  "B型事業所",
  "就労移行支援",
]

const PURPOSE_OPTIONS = [
  { value: "友活", label: "友活" },
  { value: "恋活", label: "恋活" },
  { value: "婚活", label: "婚活" },
]

export function ProfileSetupForm({ userId, userEmail }: ProfileSetupFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 基本情報
  const [displayName, setDisplayName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState("")
  const [prefecture, setPrefecture] = useState("")
  const [city, setCity] = useState("")
  const [selfIntroduction, setSelfIntroduction] = useState("")

  // ユーザー種別
  const [userType, setUserType] = useState("")

  // 詳細情報
  const [height, setHeight] = useState("")
  const [bodyType, setBodyType] = useState("")
  const [mbti, setMbti] = useState("")
  const [purpose, setPurpose] = useState<string[]>([])
  const [preferredGender, setPreferredGender] = useState<string[]>([])
  const [hangoutAreas, setHangoutAreas] = useState("")
  const [favoriteCity, setFavoriteCity] = useState("")
  const [hometown, setHometown] = useState("")

  // 就労情報
  const [employmentStatus, setEmploymentStatus] = useState("")
  const [employmentType, setEmploymentType] = useState("")

  // 生活情報
  const [livingSituation, setLivingSituation] = useState("")
  const [maritalStatus, setMaritalStatus] = useState("")
  const [independenceLevel, setIndependenceLevel] = useState("")
  const [smoking, setSmoking] = useState("")
  const [drinking, setDrinking] = useState("")

  // 障がい・難病情報
  const [hasDisability, setHasDisability] = useState(false)
  const [disabilityTypes, setDisabilityTypes] = useState<string[]>([])
  const [disabilityDetails, setDisabilityDetails] = useState("")
  const [hasChronicIllness, setHasChronicIllness] = useState(false)
  const [chronicIllness, setChronicIllness] = useState("")
  const [hasOtherIllness, setHasOtherIllness] = useState(false)
  const [otherIllness, setOtherIllness] = useState("")

  // サポーター情報
  const [supporterMessage, setSupporterMessage] = useState("")

  // タグ
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // プロフィール画像と確認書類の画像
  const [profileImages, setProfileImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [selfieImageUrl, setSelfieImageUrl] = useState("")
  const [idVerificationImageUrl, setIdVerificationImageUrl] = useState("")

  useEffect(() => {
    if (!userId || !userEmail) {
      setError("認証エラー: ユーザー情報が取得できません。再度ログインしてください。")
    }
  }, [userId, userEmail])

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

        const response = await fetch("/api/profile/upload-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("画像のアップロードに失敗しました")
        }

        const data = await response.json()
        uploadedUrls.push(data.url)
      }

      setProfileImages((prev) => [...prev, ...uploadedUrls])
    } catch (err) {
      alert(err instanceof Error ? err.message : "画像のアップロードに失敗しました")
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setProfileImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert("画像サイズは10MB以下にしてください")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "selfie_verification")

    try {
      const response = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("画像のアップロードに失敗しました")
      }

      const data = await response.json()
      setSelfieImageUrl(data.url)
    } catch (err) {
      alert(err instanceof Error ? err.message : "画像のアップロードに失敗しました")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!displayName || !gender || !prefecture || !birthDate || !userType) {
      const missingFields = []
      if (!displayName) missingFields.push("ニックネーム")
      if (!birthDate) missingFields.push("生年月日")
      if (!gender) missingFields.push("性別")
      if (!prefecture) missingFields.push("都道府県")
      if (!userType) missingFields.push("ユーザー種別")

      setError(`必須項目が入力されていません: ${missingFields.join("、")}`)
      setLoading(false)
      return
    }

    try {
      const profileData: any = {
        id: userId,
        email: userEmail,
        nickname: displayName,
        gender: gender,
        birth_date: birthDate,
        prefecture: prefecture,
        city: city || null,
        bio: selfIntroduction || null,
        user_type: userType,
        is_premium: false,
        is_active: true,
        tags: selectedTags,
        preferred_gender: preferredGender,
        purpose: purpose,
        profile_images: profileImages,
        selfie_verification_image_url: selfieImageUrl || null,
        id_verification_image_url: idVerificationImageUrl || null,
        verification_status: idVerificationImageUrl ? "pending" : null,
      }

      const { error: profileError } = await supabase.from(TABLES.PROFILES).insert([profileData]).select().single()

      if (profileError) {
        setError(`プロフィールの保存に失敗しました: ${profileError.message}`)
        setLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(`予期しないエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const toggleDisabilityType = (type: string) => {
    setDisabilityTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* プロフィール画像 */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Camera className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">プロフィール画像</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">あなたの写真をアップロードしてください（最大3枚）</p>

        <div className="flex flex-wrap gap-4">
          {profileImages.map((url, index) => (
            <div key={index} className="relative">
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
                <Image
                  src={url || "/placeholder.svg"}
                  alt={`プロフィール画像 ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-1 left-1 bg-pink-500 text-white text-xs px-2 py-0.5 rounded">
                    メイン
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {profileImages.length < 3 && (
            <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-pink-400 hover:bg-pink-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImages}
                className="hidden"
                multiple
              />
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="mt-2 text-xs text-gray-500">{uploadingImages ? "アップロード中..." : "画像を追加"}</span>
            </label>
          )}
        </div>
      </Card>

      {/* ユーザー種別 */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">あなたについて</h3>
        </div>
        <ButtonSelect options={USER_TYPES} value={userType} onChange={setUserType} columns={2} />
      </Card>

      {/* 基本情報 */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">基本情報</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">
              ニックネーム <span className="text-red-500">*</span>
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
              placeholder="例: はっしー"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">
              生年月日 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>
              性別 <span className="text-red-500">*</span>
            </Label>
            <ButtonSelect options={GENDER_OPTIONS} value={gender} onChange={setGender} columns={3} />
          </div>

          <div className="space-y-2">
            <Label>お相手の性別の希望は</Label>
            <ButtonSelectMulti
              options={PREFERRED_GENDER_OPTIONS}
              value={preferredGender}
              onChange={setPreferredGender}
              columns={3}
            />
          </div>

          <div className="space-y-2">
            <Label>主な目的</Label>
            <ButtonSelectMulti options={PURPOSE_OPTIONS} value={purpose} onChange={setPurpose} columns={3} />
          </div>

          <div className="space-y-2">
            <Label>MBTI性格診断</Label>
            <p className="text-xs text-gray-500 mb-2">16の性格タイプから選択してください</p>
            <div className="grid grid-cols-4 gap-2">
              {MBTI_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMbti(type)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    mbti === type
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                  }`}
                >
                  <div className="font-semibold">{type}</div>
                  <div className="text-xs text-gray-500">{MBTI_DESCRIPTIONS[type]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 居住地 */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">
            居住地 <span className="text-red-500">*</span>
          </h3>
        </div>
        <LocationSelector
          selectedPrefecture={prefecture}
          selectedArea={city}
          onPrefectureChange={setPrefecture}
          onAreaChange={setCity}
        />
      </Card>

      {/* 外見情報 */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">外見情報</h3>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">身長 (cm)</Label>
              <Input
                id="height"
                type="number"
                min="100"
                max="250"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                disabled={loading}
                placeholder="165"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>体型</Label>
            <div className="grid grid-cols-4 gap-2">
              {BODY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBodyType(type)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    bodyType === type
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 遊びに行く場所 */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">遊びに行く街・出身地</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hangoutAreas">遊びに行く街</Label>
            <Input
              id="hangoutAreas"
              value={hangoutAreas}
              onChange={(e) => setHangoutAreas(e.target.value)}
              disabled={loading}
              placeholder="例: 渋谷、新宿、横浜など"
            />
            <p className="text-xs text-gray-500">よく遊びに行く場所やデートで行きたい街を記入してください</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="favoriteCity">好きな街</Label>
            <Input
              id="favoriteCity"
              value={favoriteCity}
              onChange={(e) => setFavoriteCity(e.target.value)}
              disabled={loading}
              placeholder="例: 守谷、印西"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hometown">出身地</Label>
            <Input
              id="hometown"
              value={hometown}
              onChange={(e) => setHometown(e.target.value)}
              disabled={loading}
              placeholder="例: 愛知"
            />
          </div>
        </div>
      </Card>

      {/* 就労情報 */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">就労情報</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>就労状況</Label>
            <div className="grid grid-cols-2 gap-2">
              {EMPLOYMENT_STATUS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setEmploymentStatus(status)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    employmentStatus === status
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>雇用形態</Label>
            <div className="grid grid-cols-2 gap-2">
              {EMPLOYMENT_TYPE.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEmploymentType(type)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    employmentType === type
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 生活情報 */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">生活情報</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>生活状況</Label>
            <ButtonSelect
              options={LIVING_SITUATION_OPTIONS}
              value={livingSituation}
              onChange={setLivingSituation}
              columns={3}
            />
          </div>

          <div className="space-y-2">
            <Label>婚姻状況</Label>
            <div className="grid grid-cols-3 gap-2">
              {MARITAL_STATUS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setMaritalStatus(status)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    maritalStatus === status
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>自立度レベル</Label>
            <div className="grid grid-cols-2 gap-2">
              {INDEPENDENCE_LEVEL.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setIndependenceLevel(level)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    independenceLevel === level
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>喫煙</Label>
              <div className="grid grid-cols-2 gap-2">
                {SMOKING_STATUS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSmoking(status)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      smoking === status
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>飲酒</Label>
              <div className="grid grid-cols-1 gap-2">
                {DRINKING_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDrinking(option.value)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      drinking === option.value
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 障がい・難病情報（障がい者の場合のみ表示） */}
      {userType === "person_with_disability" && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <h3 className="text-lg font-semibold">障がい・難病情報</h3>
          </div>

          <div className="space-y-6">
            {/* 障がい */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasDisability"
                  checked={hasDisability}
                  onCheckedChange={(checked) => setHasDisability(checked as boolean)}
                />
                <Label htmlFor="hasDisability" className="cursor-pointer">
                  障がい
                </Label>
              </div>

              {hasDisability && (
                <div className="ml-6 space-y-4">
                  <div className="space-y-2">
                    <Label>障がいの種類（複数選択可）</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {DISABILITY_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleDisabilityType(type)}
                          className={`p-3 rounded-lg border text-center transition-all flex items-center justify-center gap-2 ${
                            disabilityTypes.includes(type)
                              ? "border-pink-500 bg-pink-50 text-pink-700"
                              : "border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                          }`}
                        >
                          {disabilityTypes.includes(type) && <Check className="h-4 w-4" />}
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disabilityDetails">障がいの詳細</Label>
                    <Textarea
                      id="disabilityDetails"
                      value={disabilityDetails}
                      onChange={(e) => setDisabilityDetails(e.target.value)}
                      disabled={loading}
                      placeholder="例: ADHD"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 指定難病 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasChronicIllness"
                  checked={hasChronicIllness}
                  onCheckedChange={(checked) => setHasChronicIllness(checked as boolean)}
                />
                <Label htmlFor="hasChronicIllness" className="cursor-pointer">
                  指定難病
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">厚生労働省が定める指定難病（338疾病）をお持ちの方</p>

              {hasChronicIllness && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="chronicIllness">難病の詳細</Label>
                  <Textarea
                    id="chronicIllness"
                    value={chronicIllness}
                    onChange={(e) => setChronicIllness(e.target.value)}
                    disabled={loading}
                    placeholder="例: もやもや病"
                    rows={2}
                  />
                </div>
              )}
            </div>

            {/* 指定難病以外の持病 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasOtherIllness"
                  checked={hasOtherIllness}
                  onCheckedChange={(checked) => setHasOtherIllness(checked as boolean)}
                />
                <Label htmlFor="hasOtherIllness" className="cursor-pointer">
                  指定難病以外の持病
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">指定難病以外の慢性疾患や持病をお持ちの方</p>

              {hasOtherIllness && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="otherIllness">持病の詳細</Label>
                  <Textarea
                    id="otherIllness"
                    value={otherIllness}
                    onChange={(e) => setOtherIllness(e.target.value)}
                    disabled={loading}
                    placeholder="例: 糖尿病、高血圧など"
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* サポーターメッセージ（サポーターの場合のみ表示） */}
      {userType === "supporter" && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">サポーターとして</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supporterMessage">メッセージ（任意）</Label>
            <Textarea
              id="supporterMessage"
              value={supporterMessage}
              onChange={(e) => setSupporterMessage(e.target.value)}
              disabled={loading}
              placeholder="障がいや難病をお持ちの方へのメッセージをお書きください"
              rows={3}
            />
          </div>
        </Card>
      )}

      {/* 興味・タグ */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">興味・タグ</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">あなたに当てはまるタグを選択してください</p>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">関係性</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.relationship.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`cursor-pointer text-sm py-2 px-3 ${
                    selectedTags.includes(tag)
                      ? "bg-pink-100 text-pink-700 border-pink-300"
                      : "bg-white hover:bg-pink-50"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {selectedTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">趣味・興味</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.interests.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`cursor-pointer text-sm py-2 px-3 ${
                    selectedTags.includes(tag)
                      ? "bg-orange-100 text-orange-700 border-orange-300"
                      : "bg-white hover:bg-orange-50"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {selectedTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {userType === "person_with_disability" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">障がい情報</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.disability.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={`cursor-pointer text-sm py-2 px-3 ${
                      selectedTags.includes(tag)
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-white hover:bg-green-50"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {selectedTags.includes(tag) && <Check className="h-3 w-3 mr-1" />}
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 本人確認・年齢確認 */}
      <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">本人確認・年齢確認</h3>
        </div>

        {/* 法的要件の通知 */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-bold mb-2">法律に基づく年齢確認について</p>
              <p className="mb-2">
                「出会い系サイト規制法」により、マッチングサービスの運営者は利用者が18歳以上であることを確認する義務があります。
              </p>
              <p>
                当サービスでは、<strong>本人確認書類</strong>と<strong>自撮り画像</strong>の両方を提出いただき、
                運営スタッフが同一人物であることを確認することで、なりすまし登録を防止しています。
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 自撮り画像のアップロード */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-600" />
              <Label className="text-base font-semibold">自撮り画像</Label>
            </div>
            <p className="text-sm text-gray-600">
              顔がはっきりわかる自撮り写真をアップロードしてください。本人確認書類の写真と照合します。
            </p>

            {selfieImageUrl ? (
              <div className="relative inline-block">
                <div className="relative h-48 w-48 overflow-hidden rounded-lg border-2 border-blue-300">
                  <Image src={selfieImageUrl || "/placeholder.svg"} alt="自撮り画像" fill className="object-cover" />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-8 w-8 rounded-full"
                  onClick={() => setSelfieImageUrl("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex h-48 w-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 hover:border-blue-500 hover:bg-blue-100/50 transition-colors">
                <input type="file" accept="image/*" onChange={handleSelfieUpload} className="hidden" />
                <Camera className="h-10 w-10 text-blue-400" />
                <span className="mt-2 text-sm text-blue-600 font-medium">自撮りを撮影/選択</span>
                <span className="text-xs text-gray-500 mt-1">JPG, PNG（10MB以下）</span>
              </label>
            )}
          </div>

          {/* 本人確認書類のアップロード */}
          <div className="space-y-4">
            <IdVerificationUpload
              label="本人確認書類"
              description="運転免許証またはマイナンバーカードの表面をアップロードしてください。顔写真と生年月日のみを選択できます。"
              value={idVerificationImageUrl}
              onImageChange={setIdVerificationImageUrl}
            />
          </div>
        </div>

        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>ご安心ください：</strong>
            本人確認書類からは生年月日と顔写真のみを確認し、氏名・住所・免許番号・マイナンバーは保存しません。
            確認完了後、書類画像は安全に管理されます。
          </p>
        </div>
      </Card>

      {/* 自己紹介 */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">自己紹介</h3>
        </div>

        <Textarea
          id="selfIntroduction"
          value={selfIntroduction}
          onChange={(e) => setSelfIntroduction(e.target.value)}
          disabled={loading}
          placeholder="あなたについて教えてください。趣味、性格、どんな出会いを求めているかなど。"
          rows={6}
        />
      </Card>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        size="lg"
        disabled={loading}
      >
        {loading ? "保存中..." : "プロフィールを作成"}
      </Button>
    </form>
  )
}
