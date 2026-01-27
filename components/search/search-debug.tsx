"use client"

import { useEffect } from "react"

interface SearchDebugProps {
  params: Record<string, string | undefined>
  profileCount: number
  blockedCount: number
  error?: string
  sampleProfile?: any
}

export function SearchDebug({ params, profileCount, blockedCount, error, sampleProfile }: SearchDebugProps) {
  useEffect(() => {
    console.log("[v0 Search Debug] 検索パラメータ:", params)
    console.log("[v0 Search Debug] ブロックリスト:", blockedCount, "件")
    console.log("[v0 Search Debug] 取得されたプロフィール:", profileCount, "件")
    if (error) {
      console.log("[v0 Search Debug] エラー:", error)
    }
    if (sampleProfile) {
      console.log("[v0 Search Debug] 最初のプロフィール:", sampleProfile)
    }
  }, [params, profileCount, blockedCount, error, sampleProfile])

  return null
}
