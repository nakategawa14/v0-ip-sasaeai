"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

interface EmailRetryButtonsProps {
  logId?: string
  retryableCount?: number
}

export function EmailRetryButtons({ logId, retryableCount }: EmailRetryButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRetry = async () => {
    setIsLoading(true)
    try {
      const endpoint = logId ? "/api/admin/email/retry" : "/api/admin/email/retry-all"
      const body = logId ? { logId } : {}

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || "リトライに成功しました")
        router.refresh()
      } else {
        alert(data.error || "リトライに失敗しました")
      }
    } catch (error) {
      alert("エラーが発生しました")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (logId) {
    // 個別リトライボタン
    return (
      <Button variant="outline" size="sm" onClick={handleRetry} disabled={isLoading}>
        <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
        リトライ
      </Button>
    )
  }

  // 一括リトライボタン
  return (
    <Button variant="default" onClick={handleRetry} disabled={isLoading}>
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "リトライ中..." : `失敗メールを一括リトライ (${retryableCount}件)`}
    </Button>
  )
}
