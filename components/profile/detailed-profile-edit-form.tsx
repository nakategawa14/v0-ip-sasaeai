"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageUpload } from "@/components/profile/image-upload"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MultipleImageUpload } from "@/components/profile/multiple-image-upload"
import { Link } from "next/link"
import {
  PREFECTURES_WITH_REGIONS,
  GENDER_OPTIONS,
  EMPLOYMENT_STATUS,
  EMPLOYMENT_TYPE,
  LIVING_SITUATION,
  MARITAL_STATUS,
  CHILDREN_STATUS,
  TAG_OPTIONS,
} from "@/lib/constants/profile-options"
import { TABLES } from "@/lib/supabase/table-names"

interface ProfileTag {
  tag_name: string
  tag_type: string
}

interface DetailedProfileEditFormProps {
  profile: {
    id: string
    nickname: string
    birth_date: string
    gender: string
    prefecture: string
    city: string
    bio: string
    favorite_city: string
    is_secret_mode: boolean
    profile_images: string[]
    id_verification_image_url: string
    selfie_verification_image_url: string
    // 障がい情報
    mental_disability: boolean
    mood_disorder: string
    anxiety_disorder: string
    developmental_disorder: string
    physical_disability: boolean
    mobility_impairment: string
    visual_impairment: string
    hearing_impairment: string
    speech_impairment: string
    internal_disability: string
    intellectual_disability: boolean
    intellectual_disability_details: string
    rare_disease: boolean
    neurological_disease: string
    immune_disease: string
    metabolic_disease: string
    cardiovascular_disease: string
    respiratory_disease: string
    blood_disease: string
    non_designated_disease: string
    welfare_equipment: boolean
    welfare_equipment_details: string
  }
  profileDetails?: {
    height: string
    body_type: string
    disability_pension: boolean
    welfare_benefits: boolean
  }
  existingTags: Array<{ tag_name: string; tag_type: string }>
}

export function DetailedProfileEditForm({ profile, profileDetails, existingTags }: DetailedProfileEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    console.log("[v0] ProfileEditForm mounted")
    console.log("[v0] Profile data:", profile)
    console.log("[v0] ProfileDetails data:", profileDetails)
    console.log("[v0] ExistingTags data:", existingTags)
  }, [profile, profileDetails, existingTags])

  // 基本情報
  const [nickname, setNickname] = useState(profile?.nickname || "")
  const [birthDate, setBirthDate] = useState(profile?.birth_date || "")
  const [gender, setGender] = useState(profile?.gender || "")
  const [prefecture, setPrefecture] = useState(profile?.prefecture || "")
  const [city, setCity] = useState(profile?.city || "")
  const [bio, setBio] = useState(profile?.bio || "")
  const [favoriteCity, setFavoriteCity] = useState(profile?.favorite_city || "")
  const [isSecretMode, setIsSecretMode] = useState(profile?.is_secret_mode || false)
  const [profileImages, setProfileImages] = useState<string[]>(profile?.profile_images || [])
  const [idVerificationImageUrl, setIdVerificationImageUrl] = useState(profile?.id_verification_image_url || "")
  const [selfieVerificationImageUrl, setSelfieVerificationImageUrl] = useState(
    profile?.selfie_verification_image_url || "",
  )

  const [height, setHeight] = useState(profileDetails?.height || "")
  const [bodyType, setBodyType] = useState(profileDetails?.body_type || "")
  const [disabilityPension, setDisabilityPension] = useState(profileDetails?.disability_pension || false)
  const [welfareBenefits, setWelfareBenefits] = useState(profileDetails?.welfare_benefits || false)

  // 障がい情報
  const [hasMentalDisability, setHasMentalDisability] = useState(profile?.mental_disability || false)
  const [moodDisorder, setMoodDisorder] = useState(profile?.mood_disorder || "")
  const [anxietyDisorder, setAnxietyDisorder] = useState(profile?.anxiety_disorder || "")
  const [developmentalDisorder, setDevelopmentalDisorder] = useState(profile?.developmental_disorder || "")
  const [hasPhysicalDisability, setHasPhysicalDisability] = useState(profile?.physical_disability || false)
  const [mobilityImpairment, setMobilityImpairment] = useState(profile?.mobility_impairment || "")
  const [visualImpairment, setVisualImpairment] = useState(profile?.visual_impairment || "")
  const [hearingImpairment, setHearingImpairment] = useState(profile?.hearing_impairment || "")
  const [speechImpairment, setSpeechImpairment] = useState(profile?.speech_impairment || "")
  const [internalDisability, setInternalDisability] = useState(profile?.internal_disability || "")
  const [hasIntellectualDisability, setHasIntellectualDisability] = useState(profile?.intellectual_disability || false)
  const [intellectualDisabilityDetails, setIntellectualDisabilityDetails] = useState(
    profile?.intellectual_disability_details || "",
  )
  const [hasRareDisease, setHasRareDisease] = useState(profile?.rare_disease || false)
  const [neurologicalDisease, setNeurologicalDisease] = useState(profile?.neurological_disease || "")
  const [immuneDisease, setImmuneDisease] = useState(profile?.immune_disease || "")
  const [metabolicDisease, setMetabolicDisease] = useState(profile?.metabolic_disease || "")
  const [cardiovascularDisease, setCardiovascularDisease] = useState(profile?.cardiovascular_disease || "")
  const [respiratoryDisease, setRespiratoryDisease] = useState(profile?.respiratory_disease || "")
  const [bloodDisease, setBloodDisease] = useState(profile?.blood_disease || "")
  const [nonDesignatedDisease, setNonDesignatedDisease] = useState(profile?.non_designated_disease || "")
  const [welfareEquipment, setWelfareEquipment] = useState(profile?.welfare_equipment || false)
  const [welfareEquipmentDetails, setWelfareEquipmentDetails] = useState(profile?.welfare_equipment_details || "")

  // 仕事・生活
  const [employmentStatus, setEmploymentStatus] = useState(profile?.occupation || "")
  const [employmentType, setEmploymentType] = useState(profile?.employment_type || "")
  const [education, setEducation] = useState(profile?.education || "")
  const [livingSituation, setLivingSituation] = useState(profile?.living_situation || "")
  const [maritalStatus, setMaritalStatus] = useState(profile?.marital_status || "")
  const [hasChildren, setHasChildren] = useState(profile?.has_children || "")
  const [smoking, setSmoking] = useState(profile?.smoking || "")
  const [drinking, setDrinking] = useState(profile?.drinking || "")
  const [canGoOutAlone, setCanGoOutAlone] = useState(profile?.can_go_out_alone !== false)
  const [independenceLevel, setIndependenceLevel] = useState(profile?.independence_level || "")
  const [familyRelationship, setFamilyRelationship] = useState(profile?.family_relationship || "")

  // タグ
  const [disabilityTags, setDisabilityTags] = useState<string[]>([])
  const [interestTags, setInterestTags] = useState<string[]>([])
  const [relationshipTags, setRelationshipTags] = useState<string[]>([])

  useEffect(() => {
    // 既存のタグをロード
    if (existingTags && Array.isArray(existingTags) && existingTags.length > 0) {
      setDisabilityTags(existingTags.filter((tag) => tag.tag_type === "disability").map((tag) => tag.tag_name))
      setInterestTags(existingTags.filter((tag) => tag.tag_type === "interest").map((tag) => tag.tag_name))
      setRelationshipTags(existingTags.filter((tag) => tag.tag_type === "relationship").map((tag) => tag.tag_name))
    }
  }, [existingTags])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsLoading(true)

    try {
      const profileData = {
        nickname,
        gender,
        birth_date: birthDate,
        prefecture,
        city,
        bio,
        favorite_city: favoriteCity,
        is_secret_mode: isSecretMode,
        profile_images: profileImages,
        id_verification_image_url: idVerificationImageUrl,
        selfie_verification_image_url: selfieVerificationImageUrl,
        employment_type:
          employmentType === "就労移行支援"
            ? "other"
            : employmentType === "A型、B型事業所"
              ? "other"
              : employmentType === "特例子会社"
                ? "full_time"
                : employmentType === "一般企業で一般雇用"
                  ? "full_time"
                  : employmentType === "一般企業で障害者雇用"
                    ? "full_time"
                    : employmentType === "自営その他"
                      ? "self_employed"
                      : "",
        updated_at: new Date().toISOString(),
      }

      const supabase = createBrowserSupabaseClient()
      const { error: profileError } = await supabase.from(TABLES.PROFILES).update(profileData).eq("id", profile.id)

      if (profileError) {
        throw profileError
      }

      const profileDetailsData = {
        profile_id: profile.id,
        height: Number.parseInt(height || "0"),
        body_type: bodyType,
        occupation: employmentStatus, // employment_statusをoccupationにマッピング
        education: education,
        living_situation: livingSituation, // キャメルケース → スネークケース
        marital_status: maritalStatus, // キャメルケース → スネークケース
        has_children: hasChildren,
        smoking: smoking,
        drinking: drinking,
        disability_details: JSON.stringify({
          mental_disability: hasMentalDisability,
          mood_disorder: moodDisorder,
          anxiety_disorder: anxietyDisorder,
          developmental_disorder: developmentalDisorder,
          physical_disability: hasPhysicalDisability,
          mobility_impairment: mobilityImpairment,
          visual_impairment: visualImpairment,
          hearing_impairment: hearingImpairment,
          speech_impairment: speechImpairment,
          internal_disability: internalDisability,
          intellectual_disability: hasIntellectualDisability,
          intellectual_disability_details: intellectualDisabilityDetails,
          welfare_equipment: welfareEquipment,
          welfare_equipment_details: welfareEquipmentDetails,
        }),
        chronic_illness_details: JSON.stringify({
          rare_disease: hasRareDisease,
          neurological_disease: neurologicalDisease,
          immune_disease: immuneDisease,
          metabolic_disease: metabolicDisease,
          cardiovascular_disease: cardiovascularDisease,
          respiratory_disease: respiratoryDisease,
          blood_disease: bloodDisease,
          non_designated_disease: nonDesignatedDisease,
        }),
        support_experience: JSON.stringify({
          employment_type: employmentType,
          disability_pension: disabilityPension,
          welfare_benefits: welfareBenefits,
          family_relationship: familyRelationship,
          independence_level: independenceLevel,
          can_go_out_alone: canGoOutAlone,
        }),
      }

      const { error: detailsError } = await supabase
        .from(TABLES.PROFILE_DETAILS)
        .upsert(profileDetailsData, { onConflict: "profile_id" })

      if (detailsError) {
        throw detailsError
      }

      // 既存のタグを削除
      const { error: deleteTagsError } = await supabase.from(TABLES.PROFILE_TAGS).delete().eq("profile_id", profile.id)

      if (deleteTagsError) {
        console.error("[v0] Tags delete error:", deleteTagsError)
      }

      // 新しいタグを挿入
      const allTags = [...disabilityTags, ...interestTags, ...relationshipTags]
      if (allTags.length > 0) {
        const tagsToInsert = allTags.map((tag) => ({
          profile_id: profile.id,
          tag_name: tag,
        }))

        const { error: insertTagsError } = await supabase.from(TABLES.PROFILE_TAGS).insert(tagsToInsert)

        if (insertTagsError) {
          console.error("[v0] Tags insert error:", insertTagsError)
        }
      }

      setSuccess(true)
      router.refresh()
    } catch (error) {
      setError("プロフィールの更新に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTag = (tag: string, category: string) => {
    if (category === "disability") {
      setDisabilityTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
    } else if (category === "interest") {
      setInterestTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
    } else if (category === "relationship") {
      setRelationshipTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-lg bg-white p-6 shadow-sm">
      {error && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-800">
          <AlertDescription>プロフィールを更新しました</AlertDescription>
        </Alert>
      )}

      {/* 基本情報 */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">基本情報</h2>

        <MultipleImageUpload
          label="プロフィール画像"
          description="あなたの写真をアップロードしてください（マスクや加工もOKです）"
          helpText="💡 お顔がはっきりわかる画像と、全身が写っている画像があるとマッチ率が上がります"
          currentImages={profileImages}
          maxImages={3}
          imageType="profile"
          onImagesChange={setProfileImages}
        />

        <div className="space-y-2">
          <Label htmlFor="nickname">ニックネーム</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例: たろう"
            required
            disabled={isLoading}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="birthDate">生年月日</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">性別</Label>
            <Select value={gender} onValueChange={setGender} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="選択" />
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prefecture">都道府県</Label>
            <Select
              value={prefecture}
              onValueChange={(value) => {
                setPrefecture(value)
                setCity("")
              }}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択" />
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
              <Label htmlFor="city">地域</Label>
              <Select value={city} onValueChange={setCity} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">自己紹介</Label>
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
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={200}
            placeholder="あなたについて自由に書いてください"
            disabled={isLoading}
          />
          <p className="text-right text-xs text-gray-500">{bio.length} / 200</p>
        </div>

        {/* 遊びに行く街 */}
        <div className="space-y-2">
          <Label htmlFor="favoriteCity">遊びに行く街</Label>
          <Input
            id="favoriteCity"
            value={favoriteCity}
            onChange={(e) => setFavoriteCity(e.target.value)}
            placeholder="例: 渋谷、新宿、梅田など"
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">よく遊びに行く場所やデートで行きたい街を記入してください</p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="secretMode" checked={isSecretMode} onCheckedChange={setIsSecretMode} disabled={isLoading} />
          <Label htmlFor="secretMode" className="cursor-pointer">
            シークレットモード（検索結果に表示されません。あなたがいいねした相手だけがプロフィールを見ることができます）
          </Label>
        </div>
      </section>

      {/* 障がい・難病情報 */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">障がい・難病情報</h3>
        <div className="space-y-6">
          {/* 精神障がい */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mentalDisability"
                checked={hasMentalDisability}
                onCheckedChange={(checked) => setHasMentalDisability(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="mentalDisability" className="font-semibold">
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
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anxietyDisorder">不安障害</Label>
                  <Input
                    id="anxietyDisorder"
                    value={anxietyDisorder}
                    onChange={(e) => setAnxietyDisorder(e.target.value)}
                    placeholder="例: パニック障害"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="developmentalDisorder">発達障がい</Label>
                  <Input
                    id="developmentalDisorder"
                    value={developmentalDisorder}
                    onChange={(e) => setDevelopmentalDisorder(e.target.value)}
                    placeholder="例: ASD、ADHD"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 身体障がい */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="physicalDisability"
                checked={hasPhysicalDisability}
                onCheckedChange={(checked) => setHasPhysicalDisability(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="physicalDisability" className="font-semibold">
                身体障がい
              </Label>
            </div>

            {hasPhysicalDisability && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label htmlFor="mobilityImpairment">肢体不自由</Label>
                  <Input
                    id="mobilityImpairment"
                    value={mobilityImpairment}
                    onChange={(e) => setMobilityImpairment(e.target.value)}
                    placeholder="詳細を記入"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visualImpairment">視覚障がい</Label>
                  <Input
                    id="visualImpairment"
                    value={visualImpairment}
                    onChange={(e) => setVisualImpairment(e.target.value)}
                    placeholder="例: 弱視、全盲"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hearingImpairment">聴覚障がい</Label>
                  <Input
                    id="hearingImpairment"
                    value={hearingImpairment}
                    onChange={(e) => setHearingImpairment(e.target.value)}
                    placeholder="例: 難聴、ろう"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speechImpairment">音声・言語障がい</Label>
                  <Input
                    id="speechImpairment"
                    value={speechImpairment}
                    onChange={(e) => setSpeechImpairment(e.target.value)}
                    placeholder="例: 構音障害、失語症"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internalDisability">内部障がい</Label>
                  <Input
                    id="internalDisability"
                    value={internalDisability}
                    onChange={(e) => setInternalDisability(e.target.value)}
                    placeholder="例: 心臓機能障害、腎臓機能障害"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 難病 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rareDisease"
                checked={hasRareDisease}
                onCheckedChange={(checked) => setHasRareDisease(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="rareDisease" className="font-semibold">
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
                    placeholder="例: もやもや病、筋ジストロフィー、パーキンソン病"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">もやもや病、筋ジストロフィー、パーキンソン病など</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="immuneDisease">免疫系疾患</Label>
                  <Input
                    id="immuneDisease"
                    value={immuneDisease}
                    onChange={(e) => setImmuneDisease(e.target.value)}
                    placeholder="例: 関節リウマチ、SLE"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">関節リウマチ、全身性エリテマトーデス(SLE)など</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metabolicDisease">代謝系疾患</Label>
                  <Input
                    id="metabolicDisease"
                    value={metabolicDisease}
                    onChange={(e) => setMetabolicDisease(e.target.value)}
                    placeholder="例: 糖尿病、甲状腺疾患"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">糖尿病、甲状腺機能低下症など</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardiovascularDisease">循環器系疾患</Label>
                  <Input
                    id="cardiovascularDisease"
                    value={cardiovascularDisease}
                    onChange={(e) => setCardiovascularDisease(e.target.value)}
                    placeholder="例: 心疾患、血管疾患"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">心筋症、拡張型心筋症など</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="respiratoryDisease">呼吸器系疾患</Label>
                  <Input
                    id="respiratoryDisease"
                    value={respiratoryDisease}
                    onChange={(e) => setRespiratoryDisease(e.target.value)}
                    placeholder="例: 喘息、肺疾患"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">重症喘息、間質性肺炎など</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodDisease">血液系疾患</Label>
                  <Input
                    id="bloodDisease"
                    value={bloodDisease}
                    onChange={(e) => setBloodDisease(e.target.value)}
                    placeholder="例: 血友病、貧血"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">血友病、再生不良性貧血など</p>
                </div>
              </div>
            )}

            {/* 「指定難病でなくても生活や仕事に影響のある病気」を独立させる */}
            <div className="ml-6 space-y-2">
              <Label htmlFor="nonDesignatedDisease">指定難病でなくても生活や仕事に影響のある病気</Label>
              <Input
                id="nonDesignatedDisease"
                value={nonDesignatedDisease}
                onChange={(e) => setNonDesignatedDisease(e.target.value)}
                placeholder="例: 脳卒中後遺症、慢性腎臓病"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">持病や慢性疾患がある方はこちらに記入してください</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 仕事・生活情報 */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">仕事・生活情報</h3>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employmentStatus">仕事</Label>
              <Select value={employmentStatus} onValueChange={setEmploymentStatus} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
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
                <Select value={employmentType} onValueChange={setEmploymentType} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択" />
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="education">教育</Label>
              <Input
                id="education"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="例: 大学在学、高卒"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="livingSituation">住まい</Label>
              <Select value={livingSituation} onValueChange={setLivingSituation} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">結婚歴</Label>
              <Select value={maritalStatus} onValueChange={setMaritalStatus} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
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
              <Select value={hasChildren} onValueChange={setHasChildren} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="選択" />
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
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canGoOutAlone"
                checked={canGoOutAlone}
                onCheckedChange={(checked) => setCanGoOutAlone(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="canGoOutAlone">ひとりで外出できる</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="drinking"
                checked={drinking === "飲酒する"}
                onCheckedChange={(checked) => setDrinking(checked ? "飲酒する" : "")}
                disabled={isLoading}
              />
              <Label htmlFor="drinking">飲酒する</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="smoking"
                checked={smoking === "喫煙する"}
                onCheckedChange={(checked) => setSmoking(checked ? "喫煙する" : "")}
                disabled={isLoading}
              />
              <Label htmlFor="smoking">喫煙する</Label>
            </div>
          </div>
        </div>
      </Card>

      {/* タグ */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">設定中のタグ</h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">恋愛・友達</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.relationship.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`cursor-pointer px-4 py-2 ${
                    relationshipTags.includes(tag)
                      ? "bg-pink-100 text-pink-800 border-pink-300"
                      : "bg-white hover:bg-pink-50"
                  }`}
                  onClick={() => !isLoading && toggleTag(tag, "relationship")}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base">趣味・興味</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.interests.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`cursor-pointer px-4 py-2 ${
                    interestTags.includes(tag)
                      ? "bg-orange-100 text-orange-800 border-orange-300"
                      : "bg-white hover:bg-orange-50"
                  }`}
                  onClick={() => !isLoading && toggleTag(tag, "interest")}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base">障がい情報</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.disability.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`cursor-pointer px-4 py-2 ${
                    disabilityTags.includes(tag)
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-white hover:bg-green-50"
                  }`}
                  onClick={() => !isLoading && toggleTag(tag, "disability")}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 本人確認 */}
      <Card className="p-6">
        {console.log("[v0] 本人確認セクションがレンダリングされています")}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">本人確認書類（任意）</h2>
            <p className="text-sm text-gray-600 mt-1">本人確認を完了すると、信頼度が上がりマッチングしやすくなります</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">ささえ愛は生年月日と顔写真のみ取得します</p>
            <p className="text-xs text-blue-700 mt-1">
              運転免許証の場合、氏名・住所・免許番号は自動的に削除され、生年月日と顔写真のみ保存されます
            </p>
          </div>

          <ImageUpload
            label="本人確認書類（免許証など）"
            description="※年齢確認は法律で義務付けられています。顔写真付き身分証明書をアップロードしてください。"
            currentImageUrl={idVerificationImageUrl}
            imageType="id_verification"
            onImageChange={setIdVerificationImageUrl}
          />

          <ImageUpload
            label="自撮り画像"
            description="本人確認書類と同じ人物であることを確認するため"
            currentImageUrl={selfieVerificationImageUrl}
            imageType="selfie_verification"
            onImageChange={setSelfieVerificationImageUrl}
            enableCamera={true}
          />
        </div>
      </Card>

      {/* 送信ボタン */}
      <div className="flex gap-4">
        <Button type="submit" className="flex-1" size="lg" disabled={isLoading || !nickname || !gender}>
          {isLoading ? "更新中..." : "更新する"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()} disabled={isLoading}>
          キャンセル
        </Button>
      </div>
    </form>
  )
}
