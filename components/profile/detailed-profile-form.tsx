"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageUpload } from "@/components/profile/image-upload"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { IdVerificationUpload } from "@/components/profile/id-verification-upload"
import {
  PREFECTURES_WITH_REGIONS,
  BODY_TYPES,
  MBTI_TYPES,
  PURPOSE_OPTIONS,
  GENDER_OPTIONS,
  EMPLOYMENT_STATUS,
  EMPLOYMENT_TYPE,
  LIVING_SITUATION,
  FAMILY_RELATIONSHIP,
  MARITAL_STATUS,
  CHILDREN_STATUS,
  INDEPENDENCE_LEVEL,
  SMOKING_STATUS,
  TAG_OPTIONS,
} from "@/lib/constants/profile-options"
import { TABLES } from "@/lib/supabase/table-names"

interface DetailedProfileFormProps {
  userId: string
  userEmail: string
}

export function DetailedProfileForm({ userId, userEmail }: DetailedProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  const [userType, setUserType] = useState<"disability" | "supporter">("disability")

  // 基本情報
  const [displayName, setDisplayName] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [gender, setGender] = useState("")
  const [preferredGender, setPreferredGender] = useState<string[]>([])
  const [purpose, setPurpose] = useState<string[]>([])
  const [prefecture, setPrefecture] = useState("")
  const [regionalArea, setRegionalArea] = useState("")
  const [hangoutAreas, setHangoutAreas] = useState("")
  const [height, setHeight] = useState("")
  const [bodyType, setBodyType] = useState("")
  const [mbti, setMbti] = useState("")
  const [selfIntroduction, setSelfIntroduction] = useState("")

  // 障がい情報
  const [hasMentalDisability, setHasMentalDisability] = useState(false)
  const [moodDisorder, setMoodDisorder] = useState("")
  const [anxietyDisorder, setAnxietyDisorder] = useState("")
  const [developmentalDisorder, setDevelopmentalDisorder] = useState("")
  const [hasIntellectualDisability, setHasIntellectualDisability] = useState(false)
  const [intellectualDisabilityDetails, setIntellectualDisabilityDetails] = useState("")
  const [hasPhysicalDisability, setHasPhysicalDisability] = useState(false)
  const [mobilityImpairment, setMobilityImpairment] = useState("")
  const [visualImpairment, setVisualImpairment] = useState("")
  const [hearingImpairment, setHearingImpairment] = useState("")
  const [speechImpairment, setSpeechImpairment] = useState("")
  const [internalDisability, setInternalDisability] = useState("")
  const [hasRareDisease, setHasRareDisease] = useState(false)
  const [neurologicalDisease, setNeurologicalDisease] = useState("")
  const [immuneDisease, setImmuneDisease] = useState("")
  const [metabolicDisease, setMetabolicDisease] = useState("")
  const [cardiovascularDisease, setCardiovascularDisease] = useState("")
  const [respiratoryDisease, setRespiratoryDisease] = useState("")
  const [bloodDisease, setBloodDisease] = useState("")
  const [nonDesignatedDisease, setNonDesignatedDisease] = useState("")
  const [welfareEquipment, setWelfareEquipment] = useState(false)
  const [welfareEquipmentDetails, setWelfareEquipmentDetails] = useState("")

  // 仕事・生活
  const [employmentStatus, setEmploymentStatus] = useState("")
  const [employmentType, setEmploymentType] = useState("")
  const [disabilityPension, setDisabilityPension] = useState(false)
  const [welfareBenefits, setWelfareBenefits] = useState(false)
  const [annualIncome, setAnnualIncome] = useState("")
  const [livingSituation, setLivingSituation] = useState("")
  const [familyRelationship, setFamilyRelationship] = useState("")
  const [maritalStatus, setMaritalStatus] = useState("")
  const [hasChildren, setHasChildren] = useState("")
  const [independenceLevel, setIndependenceLevel] = useState("")
  const [canGoOutAlone, setCanGoOutAlone] = useState(true)
  const [drinksAlcohol, setDrinksAlcohol] = useState(false)
  const [smokes, setSmokes] = useState("")
  const [gambles, setGambles] = useState(false)

  // タグ
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const [profileImageUrl, setProfileImageUrl] = useState("")
  const [idVerificationImageUrl, setIdVerificationImageUrl] = useState("")
  const [selfieVerificationImageUrl, setSelfieVerificationImageUrl] = useState("")
  const [isSecretMode, setIsSecretMode] = useState(false)
  const [favoriteCity, setFavoriteCity] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    try {
      let calculatedUserType: "person_with_disability" | "chronic_illness" | "supporter"

      if (userType === "supporter") {
        calculatedUserType = "supporter"
      } else if (userType === "disability" && hasRareDisease) {
        calculatedUserType = "chronic_illness"
      } else {
        calculatedUserType = "person_with_disability"
      }

      const profileData = {
        id: userId,
        email: userEmail,
        nickname: displayName, // display_name → nickname
        birth_date: birthDate || null,
        gender,
        prefecture,
        city: regionalArea || null,
        bio: selfIntroduction || null,
        user_type: calculatedUserType, // "individual"から計算値に変更
        profile_image_url: profileImageUrl,
        id_verification_image_url: idVerificationImageUrl,
        selfie_verification_image_url: selfieVerificationImageUrl,
        is_secret_mode: isSecretMode,
        favorite_city: favoriteCity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const profileDetailsData = {
        profile_id: userId,
        height: height ? Number.parseInt(height) : null,
        body_type: bodyType || null,
        occupation: employmentStatus || null,
        education: null,
        living_situation: livingSituation || null,
        marital_status: maritalStatus || null,
        has_children: hasChildren || null,
        want_children: null,
        smoking: smokes || null,
        drinking: drinksAlcohol || null,
        disability_type:
          hasPhysicalDisability || hasMentalDisability || hasIntellectualDisability
            ? [hasPhysicalDisability && "身体", hasMentalDisability && "精神", hasIntellectualDisability && "知的"]
                .filter(Boolean)
                .join("・")
            : null,
        disability_details:
          [
            mobilityImpairment,
            visualImpairment,
            hearingImpairment,
            speechImpairment,
            internalDisability,
            intellectualDisabilityDetails,
            moodDisorder,
            anxietyDisorder,
            developmentalDisorder,
          ]
            .filter(Boolean)
            .join(", ") || null,
      }

      const { error: profileError } = await supabase.from(TABLES.PROFILES).upsert(profileData, { onConflict: "id" })

      if (profileError) {
        setError("プロフィールの保存に失敗しました")
        setLoading(false)
        return
      }

      const { error: detailsError } = await supabase
        .from(TABLES.PROFILE_DETAILS)
        .upsert(profileDetailsData, { onConflict: "profile_id" })

      if (detailsError) {
        setError("プロフィール詳細の保存に失敗しました")
        setLoading(false)
        return
      }

      if (selectedTags.length > 0) {
        // 既存のタグを削除
        const { error: deleteError } = await supabase.from(TABLES.PROFILE_TAGS).delete().eq("profile_id", userId)

        if (deleteError) {
          // エラーログは出力しない
        }

        // 新しいタグを挿入
        const tagsData = selectedTags.map((tag) => ({
          profile_id: userId,
          tag_name: tag,
          tag_category:
            Object.keys(TAG_OPTIONS).find((category) =>
              TAG_OPTIONS[category as keyof typeof TAG_OPTIONS].tags.includes(tag),
            ) || "other",
        }))

        const { error: tagsError } = await supabase.from(TABLES.PROFILE_TAGS).insert(tagsData)

        if (tagsError) {
          // タグ保存のエラーは致命的ではないので、処理を続行
        }
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">あなたについて</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="disability"
              name="userType"
              value="disability"
              checked={userType === "disability"}
              onChange={() => setUserType("disability")}
              className="h-4 w-4"
            />
            <Label htmlFor="disability" className="font-normal cursor-pointer">
              障がいや難病をお持ちの方
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="supporter"
              name="userType"
              value="supporter"
              checked={userType === "supporter"}
              onChange={() => setUserType("supporter")}
              className="h-4 w-4"
            />
            <Label htmlFor="supporter" className="font-normal cursor-pointer">
              理解ある健常者
            </Label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">基本情報</h3>
        <div className="space-y-4">
          <ImageUpload
            label="プロフィール画像"
            description="あなたの写真をアップロードしてください（マスクや加工もOKです）"
            currentImageUrl={profileImageUrl}
            imageType="profile"
            onImageChange={setProfileImageUrl}
          />

          <div className="flex items-center space-x-2 rounded-lg border p-4">
            <Switch id="secretMode" checked={isSecretMode} onCheckedChange={setIsSecretMode} />
            <Label htmlFor="secretMode" className="cursor-pointer flex-1">
              シークレットモード（検索結果に表示されません。あなたがいいねした相手だけがプロフィールを見ることができます）
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">
              ニックネーム <span className="text-red-500">*</span>
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="例: はっしー"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">生年月日</Label>
            <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">
              性別 <span className="text-red-500">*</span>
            </Label>
            <Select value={gender} onValueChange={setGender} required>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>お相手の性別の希望は</Label>
            <div className="space-y-2">
              {GENDER_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`preferred-${option.value}`}
                    checked={preferredGender.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPreferredGender([...preferredGender, option.value])
                      } else {
                        setPreferredGender(preferredGender.filter((g) => g !== option.value))
                      }
                    }}
                  />
                  <Label htmlFor={`preferred-${option.value}`} className="font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>主な目的</Label>
            <div className="space-y-2">
              {PURPOSE_OPTIONS.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`purpose-${option}`}
                    checked={purpose.includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPurpose([...purpose, option])
                      } else {
                        setPurpose(purpose.filter((p) => p !== option))
                      }
                    }}
                  />
                  <Label htmlFor={`purpose-${option}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mbti">MBTIテスト</Label>
            <Select value={mbti} onValueChange={setMbti}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {MBTI_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prefecture">都道府県</Label>
            <Select
              value={prefecture}
              onValueChange={(value) => {
                setPrefecture(value)
                setRegionalArea("")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PREFECTURES_WITH_REGIONS).map((pref) => (
                  <SelectItem key={pref} value={pref}>
                    {pref}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {prefecture && PREFECTURES_WITH_REGIONS[prefecture] && (
            <div className="space-y-2">
              <Label htmlFor="regionalArea">地域</Label>
              <Select value={regionalArea} onValueChange={setRegionalArea}>
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {PREFECTURES_WITH_REGIONS[prefecture].map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="hangoutAreas">遊びに行く街</Label>
            <Input
              id="hangoutAreas"
              value={hangoutAreas}
              onChange={(e) => setHangoutAreas(e.target.value)}
              placeholder="例: つくば、水戸"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">身長 (cm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="165"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyType">体型</Label>
              <Select value={bodyType} onValueChange={setBodyType}>
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {BODY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="favoriteCity">遊びに行く街</Label>
            <Input
              id="favoriteCity"
              value={favoriteCity}
              onChange={(e) => setFavoriteCity(e.target.value)}
              placeholder="例: 渋谷、新宿、梅田など"
            />
            <p className="text-sm text-muted-foreground">よく遊びに行く場所やデートで行きたい街を記入してください</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {userType === "disability" && (
        <>
          <div>
            <h3 className="mb-4 text-lg font-semibold">障がい・難病情報</h3>
            <p className="mb-4 text-sm text-gray-600">該当する項目にチェックを入れ、詳細を記入してください</p>

            <div className="space-y-6">
              {/* 精神障がい */}
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mentalDisability"
                      checked={hasMentalDisability}
                      onCheckedChange={(checked) => setHasMentalDisability(checked as boolean)}
                    />
                    <Label htmlFor="mentalDisability" className="text-base font-semibold">
                      精神障がい
                    </Label>
                  </div>

                  {hasMentalDisability && (
                    <div className="ml-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="moodDisorder">気分障害</Label>
                        <Input
                          id="moodDisorder"
                          value={moodDisorder}
                          onChange={(e) => setMoodDisorder(e.target.value)}
                          placeholder="例: うつ病、双極性障害"
                        />
                        <p className="text-xs text-gray-500">うつ病/双極性障害など</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="anxietyDisorder">不安障害</Label>
                        <Input
                          id="anxietyDisorder"
                          value={anxietyDisorder}
                          onChange={(e) => setAnxietyDisorder(e.target.value)}
                          placeholder="例: パニック障害"
                        />
                        <p className="text-xs text-gray-500">不安障害/強迫性障害/適応障害など</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="developmentalDisorder">発達障害</Label>
                        <Input
                          id="developmentalDisorder"
                          value={developmentalDisorder}
                          onChange={(e) => setDevelopmentalDisorder(e.target.value)}
                          placeholder="例: ASD、ADHD"
                        />
                        <p className="text-xs text-gray-500">ADHD/ASD/LD/その他</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 知的障がい */}
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="intellectualDisability"
                      checked={hasIntellectualDisability}
                      onCheckedChange={(checked) => setHasIntellectualDisability(checked as boolean)}
                    />
                    <Label htmlFor="intellectualDisability" className="text-base font-semibold">
                      知的障がい
                    </Label>
                  </div>

                  {hasIntellectualDisability && (
                    <div className="ml-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="intellectualDisabilityDetails">詳細</Label>
                        <Input
                          id="intellectualDisabilityDetails"
                          value={intellectualDisabilityDetails}
                          onChange={(e) => setIntellectualDisabilityDetails(e.target.value)}
                          placeholder="例: 軽度、中度、重度"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 身体障がい */}
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="physicalDisability"
                      checked={hasPhysicalDisability}
                      onCheckedChange={(checked) => setHasPhysicalDisability(checked as boolean)}
                    />
                    <Label htmlFor="physicalDisability" className="text-base font-semibold">
                      身体障がい
                    </Label>
                  </div>

                  {hasPhysicalDisability && (
                    <div className="ml-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobilityImpairment">肢体不自由</Label>
                        <Input
                          id="mobilityImpairment"
                          value={mobilityImpairment}
                          onChange={(e) => setMobilityImpairment(e.target.value)}
                          placeholder="例: 上肢障害、下肢障害、体幹機能障害"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="visualImpairment">視覚障がい</Label>
                        <Input
                          id="visualImpairment"
                          value={visualImpairment}
                          onChange={(e) => setVisualImpairment(e.target.value)}
                          placeholder="例: 弱視、全盲"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hearingImpairment">聴覚障がい</Label>
                        <Input
                          id="hearingImpairment"
                          value={hearingImpairment}
                          onChange={(e) => setHearingImpairment(e.target.value)}
                          placeholder="例: 難聴、ろう"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="speechImpairment">音声・言語障がい</Label>
                        <Input
                          id="speechImpairment"
                          value={speechImpairment}
                          onChange={(e) => setSpeechImpairment(e.target.value)}
                          placeholder="例: 構音障害、失語症"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="internalDisability">内部障がい</Label>
                        <Input
                          id="internalDisability"
                          value={internalDisability}
                          onChange={(e) => setInternalDisability(e.target.value)}
                          placeholder="例: 心臓機能障害、腎臓機能障害、肝臓機能障害"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 難病 */}
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rareDisease"
                      checked={hasRareDisease}
                      onCheckedChange={(checked) => setHasRareDisease(checked as boolean)}
                    />
                    <Label htmlFor="rareDisease" className="text-base font-semibold">
                      難病
                    </Label>
                  </div>

                  {hasRareDisease && (
                    <div className="ml-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="neurologicalDisease">神経・筋疾患</Label>
                        <Input
                          id="neurologicalDisease"
                          value={neurologicalDisease}
                          onChange={(e) => setNeurologicalDisease(e.target.value)}
                          placeholder="例: もやもや病、パーキンソン病、多発性硬化症、筋ジストロフィー"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="immuneDisease">免疫系疾患</Label>
                        <Input
                          id="immuneDisease"
                          value={immuneDisease}
                          onChange={(e) => setImmuneDisease(e.target.value)}
                          placeholder="例: 関節リウマチ、全身性エリテマトーデス、潰瘍性大腸炎、クローン病"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="metabolicDisease">代謝系疾患</Label>
                        <Input
                          id="metabolicDisease"
                          value={metabolicDisease}
                          onChange={(e) => setMetabolicDisease(e.target.value)}
                          placeholder="例: 糖尿病、甲状腺機能低下症"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardiovascularDisease">循環器系疾患</Label>
                        <Input
                          id="cardiovascularDisease"
                          value={cardiovascularDisease}
                          onChange={(e) => setCardiovascularDisease(e.target.value)}
                          placeholder="例: 拡張型心筋症、肺高血圧症"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="respiratoryDisease">呼吸器系疾患</Label>
                        <Input
                          id="respiratoryDisease"
                          value={respiratoryDisease}
                          onChange={(e) => setRespiratoryDisease(e.target.value)}
                          placeholder="例: 特発性間質性肺炎、サルコイドーシス"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bloodDisease">血液系疾患</Label>
                        <Input
                          id="bloodDisease"
                          value={bloodDisease}
                          onChange={(e) => setBloodDisease(e.target.value)}
                          placeholder="例: 再生不良性貧血、血友病"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nonDesignatedDisease">指定難病でなくても生活や仕事に影響のある病気</Label>
                        <Input
                          id="nonDesignatedDisease"
                          value={nonDesignatedDisease}
                          onChange={(e) => setNonDesignatedDisease(e.target.value)}
                          placeholder="例: 脳卒中、がん、慢性腎臓病"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="welfareEquipment"
                            checked={welfareEquipment}
                            onCheckedChange={(checked) => setWelfareEquipment(checked as boolean)}
                          />
                          <Label htmlFor="welfareEquipment">福祉用具の使用</Label>
                        </div>
                        {welfareEquipment && (
                          <Input
                            value={welfareEquipmentDetails}
                            onChange={(e) => setWelfareEquipmentDetails(e.target.value)}
                            placeholder="例: 杖"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">仕事・生活情報</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employmentStatus">仕事</Label>
            <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_STATUS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {employmentStatus === "働いてる" && (
            <div className="space-y-2">
              <Label htmlFor="employmentType">雇用形態</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPE.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disabilityPension"
                checked={disabilityPension}
                onCheckedChange={(checked) => setDisabilityPension(checked as boolean)}
              />
              <Label htmlFor="disabilityPension" className="cursor-pointer flex-1">
                障害年金受給
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="welfareBenefits"
                checked={welfareBenefits}
                onCheckedChange={(checked) => setWelfareBenefits(checked as boolean)}
              />
              <Label htmlFor="welfareBenefits" className="cursor-pointer flex-1">
                生活保護受給
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="livingSituation">住まい</Label>
            <Select value={livingSituation} onValueChange={setLivingSituation}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {LIVING_SITUATION.map((situation) => (
                  <SelectItem key={situation} value={situation}>
                    {situation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="familyRelationship">家族との関係</Label>
            <Select value={familyRelationship} onValueChange={setFamilyRelationship}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {FAMILY_RELATIONSHIP.map((relationship) => (
                  <SelectItem key={relationship} value={relationship}>
                    {relationship}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maritalStatus">結婚歴</Label>
            <Select value={maritalStatus} onValueChange={setMaritalStatus}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {MARITAL_STATUS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hasChildren">子ども</Label>
            <Select value={hasChildren} onValueChange={setHasChildren}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {CHILDREN_STATUS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="independenceLevel">生活の自立度</Label>
            <Select value={independenceLevel} onValueChange={setIndependenceLevel}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {INDEPENDENCE_LEVEL.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canGoOutAlone"
                checked={canGoOutAlone}
                onCheckedChange={(checked) => setCanGoOutAlone(checked as boolean)}
              />
              <Label htmlFor="canGoOutAlone" className="cursor-pointer flex-1">
                ひとりで外出できる
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="drinksAlcohol"
                checked={drinksAlcohol}
                onCheckedChange={(checked) => setDrinksAlcohol(checked as boolean)}
              />
              <Label htmlFor="drinksAlcohol" className="cursor-pointer flex-1">
                飲酒する
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smokes">タバコ</Label>
            <Select value={smokes} onValueChange={setSmokes}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {SMOKING_STATUS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="gambles" checked={gambles} onCheckedChange={(checked) => setGambles(checked as boolean)} />
              <Label htmlFor="gambles" className="cursor-pointer flex-1">
                ギャンブルをする
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">設定中のタグ</h3>
        <p className="mb-4 text-sm text-gray-600">あなたに当てはまるタグを選択してください</p>

        <div className="space-y-6">
          {/* 恋愛・友達 */}
          <div className="space-y-3">
            <Label className="text-base">恋愛・友達</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.relationship.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`cursor-pointer px-4 py-2 text-sm ${
                    selectedTags.includes(tag)
                      ? "bg-pink-100 text-pink-800 border-pink-300"
                      : "bg-white hover:bg-pink-50 border-gray-300"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 趣味・興味 */}
          <div className="space-y-3">
            <Label className="text-base">趣味・興味</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.interests.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`cursor-pointer px-4 py-2 text-sm ${
                    selectedTags.includes(tag)
                      ? "bg-orange-100 text-orange-800 border-orange-300"
                      : "bg-white hover:bg-orange-50 border-gray-300"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* 障がい情報 */}
          <div className="space-y-3">
            <Label className="text-base">障がい情報</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.disability.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`cursor-pointer px-4 py-2 text-sm ${
                    selectedTags.includes(tag)
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-white hover:bg-green-50 border-gray-300"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">本人確認書類（任意）</h3>
        <p className="mb-2 text-sm text-gray-600">本人確認を完了すると、信頼度が上がりマッチングしやすくなります</p>

        <div className="mb-4 rounded-lg border-2 border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-900">
            ※年齢確認と本人確認認証が完了しないとお相手の検索ができません
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="mb-2 text-sm font-semibold text-blue-900">プライバシー保護</p>
          <p className="text-sm text-blue-800">
            ささえ愛は生年月日と顔写真のみを取得します。氏名・住所・免許番号などの個人情報は保存されません。
          </p>
          <p className="mt-2 text-sm text-blue-800">
            運転免許証の場合：氏名・住所・免許番号は自動的に削除され、生年月日と顔写真のみが保存されます。上部から下部まで完全に保存されるため、生年月日が切れることはありません。
          </p>
        </div>

        <div className="space-y-6">
          <IdVerificationUpload
            label="本人確認書類（免許証など）"
            description="※年齢確認は法律で義務付けられています。顔写真付きの身分証明書をアップロードしてください。"
            currentImageUrl={idVerificationImageUrl}
            onImageChange={setIdVerificationImageUrl}
          />

          <ImageUpload
            label="自撮り画像"
            description="本人確認書類と同じ人物であることを確認するため"
            currentImageUrl={selfieVerificationImageUrl}
            imageType="selfie_verification"
            onImageChange={setSelfieVerificationImageUrl}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="selfIntroduction">自己PR文（800字以内）</Label>
        <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            💡 自己PR文は詳しく書くとマッチ率が上がります
          </p>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            趣味や好きなこと、どんな方と知り合いたいかなど、具体的に書くと効果的です。
            <Link href="/profile/examples" className="ml-2 underline hover:no-underline">
              プロフィール見本を見る
            </Link>
          </p>
        </div>
        <Textarea
          id="selfIntroduction"
          value={selfIntroduction}
          onChange={(e) => setSelfIntroduction(e.target.value)}
          rows={8}
          maxLength={800}
          placeholder="あなたについて自由に書いてください"
        />
        <p className="text-right text-xs text-gray-500">{selfIntroduction.length} / 800</p>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ステップインジケーター */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex flex-1 items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                currentStep >= step ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {step}
            </div>
            {step < 4 && <div className={`h-1 flex-1 ${currentStep > step ? "bg-primary" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* ステップコンテンツ */}
      <Card className="p-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </Card>

      {/* ナビゲーションボタン */}
      <div className="flex justify-between gap-4">
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={loading}>
            戻る
          </Button>
        )}
        <div className="flex-1" />
        {currentStep < 4 ? (
          <Button type="button" onClick={() => setCurrentStep(currentStep + 1)} disabled={loading}>
            次へ
          </Button>
        ) : (
          <Button type="submit" disabled={loading || !displayName || !gender}>
            {loading ? "保存中..." : "プロフィールを作成"}
          </Button>
        )}
      </div>
    </form>
  )
}
