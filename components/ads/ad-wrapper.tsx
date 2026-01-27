"use client"

import { useEffect, useState } from "react"
import { AdBanner } from "./ad-banner"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface AdWrapperProps {
  position: "top" | "bottom" | "sidebar"
  adType?: "amazon" | "rakuten" | "random"
  userId: string
}

export function AdWrapper({ position, adType, userId }: AdWrapperProps) {
  const [showAd, setShowAd] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMembership = async () => {
      const supabase = createBrowserSupabaseClient()
      const { data: profile } = await supabase.from("profiles").select("membership_status").eq("id", userId).single()

      // 無料会員のみ広告を表示
      setShowAd(profile?.membership_status === "free")
      setLoading(false)
    }

    checkMembership()
  }, [userId])

  if (loading || !showAd) return null

  return <AdBanner position={position} adType={adType} />
}
