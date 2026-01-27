"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export function AmazonAffiliateCard() {
  const amazonUrl = "https://www.amazon.co.jp/?tag=YOUR_AFFILIATE_ID"

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 p-6">
      <h2 className="mb-2 text-xl font-semibold text-gray-900">サービス維持にご協力ください</h2>
      <p className="mb-4 text-sm text-gray-700">
        「ささえ愛」は格安でのサービス提供を目指しています。
        <br />
        よろしければ、1日1クリックのご協力をお願いします。
      </p>
      <Button
        variant="outline"
        className="w-full border-orange-400 bg-white hover:bg-orange-50"
        onClick={() => window.open(amazonUrl, "_blank")}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Amazonで応援する
      </Button>
    </Card>
  )
}
