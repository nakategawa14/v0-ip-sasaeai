"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { TABLES } from "@/lib/supabase/table-names"
import { SuspendedPage } from "./suspended-page"

export function SuspensionCheckWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [suspension, setSuspension] = useState<{
    type: "temporary" | "permanent"
    reason: string
    ends_at: string | null
  } | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // 停止ページ・OAuth コールバックではサスペンション UI に任せる／ループ回避
    if (pathname === "/suspended" || pathname.startsWith("/auth")) {
      setIsChecking(false)
      return
    }

    const checkSuspension = async () => {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsChecking(false)
        return
      }

      const { data: profileRow } = await supabase
        .from(TABLES.PROFILES)
        .select("status")
        .eq("id", user.id)
        .maybeSingle()

      if (profileRow?.status === "blocked") {
        await supabase.auth.signOut()
        router.replace("/login?blocked=1")
        setSuspension(null)
        setIsChecking(false)
        return
      }

      const now = new Date().toISOString()
      const { data: activeSuspension, error } = await supabase
        .from(TABLES.SUSPENSIONS)
        .select("suspension_type, suspension_reason, ends_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .is("lifted_at", null)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      // エラーがあってもログのみ、停止チェックは続行
      if (error) {
        console.error("[v0] Suspension check error:", error)
      }

      if (activeSuspension) {
        setSuspension({
          type: activeSuspension.suspension_type === "permanent" ? "permanent" : "temporary",
          reason: activeSuspension.suspension_reason,
          ends_at: activeSuspension.ends_at,
        })
      }

      setIsChecking(false)
    }

    void checkSuspension()
  }, [pathname, router])

  // チェック中はローディング表示
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 停止中ならSuspendedPageを表示
  if (suspension) {
    return <SuspendedPage suspension={suspension} />
  }

  return <>{children}</>
}
