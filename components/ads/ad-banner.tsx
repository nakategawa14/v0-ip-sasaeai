"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdBannerProps {
  position: "top" | "bottom" | "sidebar"
  adType?: "amazon" | "rakuten" | "random"
}

export function AdBanner({ position, adType = "random" }: AdBannerProps) {
  const [showAd, setShowAd] = useState(true)
  const [selectedAdType, setSelectedAdType] = useState<"amazon" | "rakuten">("amazon")

  useEffect(() => {
    // ランダムに広告タイプを選択
    if (adType === "random") {
      setSelectedAdType(Math.random() > 0.5 ? "amazon" : "rakuten")
    } else {
      setSelectedAdType(adType)
    }
  }, [adType])

  if (!showAd) return null

  const adContent = {
    amazon: {
      title: "Amazon おすすめ商品",
      description: "格安でのサービス提供のため、広告閲覧にご協力ください",
      link: "https://www.amazon.co.jp/?tag=YOUR_AFFILIATE_ID",
      linkText: "Amazonで見る",
    },
    rakuten: {
      title: "楽天 おすすめ商品",
      description: "格安でのサービス提供のため、広告閲覧にご協力ください",
      link: "https://room.rakuten.co.jp/YOUR_ROOM_ID",
      linkText: "楽天ROOMで見る",
    },
  }

  const ad = adContent[selectedAdType]

  const positionStyles = {
    top: "mb-6",
    bottom: "mt-6",
    sidebar: "sticky top-4",
  }

  return (
    <Card
      className={`relative p-4 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 ${positionStyles[position]}`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-50 hover:opacity-100"
        onClick={() => setShowAd(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="pr-8">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">スポンサー</p>
            <h3 className="font-semibold text-sm mb-1">{ad.title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{ad.description}</p>
            <a
              href={ad.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 text-xs font-medium transition-colors"
            >
              {ad.linkText}
            </a>
          </div>
        </div>
      </div>
    </Card>
  )
}
