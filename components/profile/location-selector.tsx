"use client"

import { useState, useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import { REGION_GROUPS, PREFECTURES_WITH_REGIONS } from "@/lib/constants/profile-options"
import { cn } from "@/lib/utils"

interface LocationSelectorProps {
  prefecture?: string
  selectedPrefecture?: string
  area?: string
  selectedArea?: string
  onPrefectureChange: (value: string) => void
  onAreaChange: (value: string) => void
}

export function LocationSelector({
  prefecture: prefectureProp,
  selectedPrefecture,
  area: areaProp,
  selectedArea,
  onPrefectureChange,
  onAreaChange,
}: LocationSelectorProps) {
  const prefecture = prefectureProp || selectedPrefecture || ""
  const area = areaProp || selectedArea || ""

  const [selectedRegion, setSelectedRegion] = useState<string>("")
  const [step, setStep] = useState<"region" | "prefecture" | "area">("region")

  useEffect(() => {
    if (prefecture) {
      for (const [region, prefs] of Object.entries(REGION_GROUPS)) {
        if (prefs.includes(prefecture)) {
          setSelectedRegion(region)
          setStep("area")
          break
        }
      }
    }
  }, [prefecture])

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region)
    setStep("prefecture")
  }

  const handlePrefectureSelect = (pref: string) => {
    onPrefectureChange(pref)
    onAreaChange("")
    setStep("area")
  }

  const handleAreaSelect = (selectedAreaValue: string) => {
    onAreaChange(selectedAreaValue)
  }

  const handleBack = () => {
    if (step === "area") {
      setStep("prefecture")
      onAreaChange("")
    } else if (step === "prefecture") {
      setStep("region")
      setSelectedRegion("")
      onPrefectureChange("")
    }
  }

  const handleClear = () => {
    setStep("region")
    setSelectedRegion("")
    onPrefectureChange("")
    onAreaChange("")
  }

  const regions = Object.keys(REGION_GROUPS)
  const prefecturesInRegion = selectedRegion && REGION_GROUPS[selectedRegion] ? REGION_GROUPS[selectedRegion] : []
  const areasInPrefecture =
    prefecture && PREFECTURES_WITH_REGIONS[prefecture] ? PREFECTURES_WITH_REGIONS[prefecture] : []

  return (
    <div className="space-y-4">
      {(prefecture || area) && (
        <div className="flex items-center gap-2 rounded-lg bg-pink-50 p-3">
          <span className="text-sm font-medium text-pink-700">
            選択中: {prefecture}
            {area ? ` / ${area}` : ""}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="ml-auto text-sm text-pink-600 hover:text-pink-800 underline"
          >
            クリア
          </button>
        </div>
      )}

      {step !== "region" && (
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="h-4 w-4" />
          戻る
        </button>
      )}

      {step === "region" && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">地方を選択してください</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {regions.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => handleRegionSelect(region)}
                className={cn(
                  "rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                  selectedRegion === region
                    ? "border-pink-500 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50/50",
                )}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "prefecture" && selectedRegion && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">{selectedRegion}の都道府県を選択してください</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {prefecturesInRegion.map((pref) => (
              <button
                key={pref}
                type="button"
                onClick={() => handlePrefectureSelect(pref)}
                className={cn(
                  "rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                  prefecture === pref
                    ? "border-pink-500 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50/50",
                )}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "area" && prefecture && areasInPrefecture.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">{prefecture}のエリアを選択してください</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {areasInPrefecture.map((areaOption) => (
              <button
                key={areaOption}
                type="button"
                onClick={() => handleAreaSelect(areaOption)}
                className={cn(
                  "rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                  area === areaOption
                    ? "border-pink-500 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50/50",
                )}
              >
                {areaOption}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
