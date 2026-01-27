"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Search, X, ChevronDown, ChevronUp } from "lucide-react"
import { PREFECTURE_AREAS } from "@/lib/constants/options"

const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
]

const PREFECTURE_KEY_MAP: Record<string, string> = {
  北海道: "hokkaido",
  茨城県: "ibaraki",
  千葉県: "chiba",
  東京都: "tokyo",
  神奈川県: "kanagawa",
  埼玉県: "saitama",
  大阪府: "osaka",
  京都府: "kyoto",
  兵庫県: "hyogo",
  福岡県: "fukuoka",
  愛知県: "aichi",
}

const DISABILITY_DETAILS = {
  身体障がい: ["上肢", "下肢", "体幹", "視覚", "聴覚", "音声・言語", "内部障がい"],
  精神障がい: ["統合失調症", "双極性障害", "うつ病", "不安障害", "強迫性障害", "PTSD"],
  知的障がい: ["軽度", "中度", "重度", "境界知能"],
  発達障がい: ["ADHD", "ASD", "LD", "グレーゾーン"],
  難病: ["神経筋疾患", "免疫系疾患", "血液系疾患", "内分泌代謝", "消化器系"],
}

interface SearchFiltersProps {
  currentFilters: {
    gender?: string
    prefecture?: string
    area?: string
    age_min?: string
    age_max?: string
    user_type?: string
    disability_type?: string
    disability_detail?: string
    employment_type?: string
    living_situation?: string
    can_go_out_alone?: string
  }
}

export function SearchFilters({ currentFilters }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [gender, setGender] = useState(currentFilters.gender || "")
  const [prefecture, setPrefecture] = useState(currentFilters.prefecture || "")
  const [area, setArea] = useState(currentFilters.area || "")
  const [ageMin, setAgeMin] = useState(currentFilters.age_min || "")
  const [ageMax, setAgeMax] = useState(currentFilters.age_max || "")
  const [userType, setUserType] = useState(currentFilters.user_type || "")
  const [disabilityType, setDisabilityType] = useState(currentFilters.disability_type || "")
  const [disabilityDetail, setDisabilityDetail] = useState(currentFilters.disability_detail || "")
  const [employmentType, setEmploymentType] = useState(currentFilters.employment_type || "")
  const [livingSituation, setLivingSituation] = useState(currentFilters.living_situation || "")
  const [canGoOutAlone, setCanGoOutAlone] = useState(currentFilters.can_go_out_alone || "")
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    setArea("")
  }, [prefecture])

  useEffect(() => {
    setDisabilityDetail("")
  }, [disabilityType])

  const availableAreas =
    prefecture && PREFECTURE_KEY_MAP[prefecture] ? PREFECTURE_AREAS[PREFECTURE_KEY_MAP[prefecture]] || [] : []

  const availableDisabilityDetails =
    disabilityType && DISABILITY_DETAILS[disabilityType as keyof typeof DISABILITY_DETAILS]
      ? DISABILITY_DETAILS[disabilityType as keyof typeof DISABILITY_DETAILS]
      : []

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (gender) params.set("gender", gender)
    if (prefecture) params.set("prefecture", prefecture)
    if (area) params.set("area", area)
    if (ageMin) params.set("age_min", ageMin)
    if (ageMax) params.set("age_max", ageMax)
    if (userType) params.set("user_type", userType)
    if (disabilityType) params.set("disability_type", disabilityType)
    if (disabilityDetail) params.set("disability_detail", disabilityDetail)
    if (employmentType) params.set("employment_type", employmentType)
    if (livingSituation) params.set("living_situation", livingSituation)
    if (canGoOutAlone) params.set("can_go_out_alone", canGoOutAlone)

    router.push(`/search?${params.toString()}`)
  }

  const handleReset = () => {
    setGender("")
    setPrefecture("")
    setArea("")
    setAgeMin("")
    setAgeMax("")
    setUserType("")
    setDisabilityType("")
    setDisabilityDetail("")
    setEmploymentType("")
    setLivingSituation("")
    setCanGoOutAlone("")
    router.push("/search")
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">検索条件</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <X className="mr-2 h-4 w-4" />
          クリア
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="gender">性別</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="男性">男性</SelectItem>
              <SelectItem value="女性">女性</SelectItem>
              <SelectItem value="その他">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prefecture">都道府県</Label>
          <Select value={prefecture} onValueChange={setPrefecture}>
            <SelectTrigger id="prefecture">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              {PREFECTURES.map((pref) => (
                <SelectItem key={pref} value={pref}>
                  {pref}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="area">エリア</Label>
          <Select value={area} onValueChange={setArea} disabled={!prefecture || availableAreas.length === 0}>
            <SelectTrigger id="area">
              <SelectValue placeholder={prefecture ? "エリアを選択" : "まず都道府県を選択"} />
            </SelectTrigger>
            <SelectContent>
              {availableAreas.map((areaOption) => (
                <SelectItem key={areaOption.value} value={areaOption.label}>
                  {areaOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="age_min">年齢（下限）</Label>
          <Select value={ageMin} onValueChange={setAgeMin}>
            <SelectTrigger id="age_min">
              <SelectValue placeholder="指定なし" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 63 }, (_, i) => i + 18).map((age) => (
                <SelectItem key={age} value={age.toString()}>
                  {age}歳
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="age_max">年齢（上限）</Label>
          <Select value={ageMax} onValueChange={setAgeMax}>
            <SelectTrigger id="age_max">
              <SelectValue placeholder="指定なし" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 63 }, (_, i) => i + 18).map((age) => (
                <SelectItem key={age} value={age.toString()}>
                  {age}歳
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full">
          {showAdvanced ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              詳細条件を閉じる
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              詳細条件を表示
            </>
          )}
        </Button>
      </div>

      {showAdvanced && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="user_type">利用者タイプ</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger id="user_type">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="障がいのある方">障がいのある方</SelectItem>
                  <SelectItem value="サポーター">サポーター</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disability_type">障がいの種類</Label>
              <Select value={disabilityType} onValueChange={setDisabilityType}>
                <SelectTrigger id="disability_type">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="身体障がい">身体障がい</SelectItem>
                  <SelectItem value="精神障がい">精神障がい</SelectItem>
                  <SelectItem value="知的障がい">知的障がい</SelectItem>
                  <SelectItem value="発達障がい">発達障がい</SelectItem>
                  <SelectItem value="難病">難病</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disability_detail">障がいの詳細</Label>
              <Select
                value={disabilityDetail}
                onValueChange={setDisabilityDetail}
                disabled={!disabilityType || availableDisabilityDetails.length === 0}
              >
                <SelectTrigger id="disability_detail">
                  <SelectValue placeholder={disabilityType ? "詳細を選択" : "まず種類を選択"} />
                </SelectTrigger>
                <SelectContent>
                  {availableDisabilityDetails.map((detail) => (
                    <SelectItem key={detail} value={detail}>
                      {detail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type">就労形態</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger id="employment_type">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="正社員">正社員</SelectItem>
                  <SelectItem value="契約社員・派遣">契約社員・派遣</SelectItem>
                  <SelectItem value="パート・アルバイト">パート・アルバイト</SelectItem>
                  <SelectItem value="自営業・フリーランス">自営業・フリーランス</SelectItem>
                  <SelectItem value="就労継続支援A型">就労継続支援A型</SelectItem>
                  <SelectItem value="就労継続支援B型">就労継続支援B型</SelectItem>
                  <SelectItem value="就労移行支援">就労移行支援</SelectItem>
                  <SelectItem value="学生">学生</SelectItem>
                  <SelectItem value="求職中">求職中</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="living_situation">生活状況</Label>
              <Select value={livingSituation} onValueChange={setLivingSituation}>
                <SelectTrigger id="living_situation">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="一人暮らし">一人暮らし</SelectItem>
                  <SelectItem value="家族と同居">家族と同居</SelectItem>
                  <SelectItem value="グループホーム">グループホーム</SelectItem>
                  <SelectItem value="施設入所">施設入所</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="can_go_out_alone">一人で外出</Label>
              <Select value={canGoOutAlone} onValueChange={setCanGoOutAlone}>
                <SelectTrigger id="can_go_out_alone">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="はい">できる</SelectItem>
                  <SelectItem value="いいえ">できない</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Button onClick={handleSearch} className="w-full">
          <Search className="mr-2 h-4 w-4" />
          検索する
        </Button>
      </div>
    </Card>
  )
}
