"use client"

import Link from "next/link"
import type { ReactNode } from "react"

type Props = {
  href: string
  children: ReactNode
}

/** admin 配下への遷移のみ許可（誤って /dashboard 等へ飛ばない） */
function sanitizeAdminHref(href: string): string {
  const trimmed = href.trim()
  if (!trimmed.startsWith("/admin")) {
    return "/admin"
  }
  if (trimmed.includes("/admin/reports/")) {
    const segment = trimmed.split("/admin/reports/")[1]?.split("?")[0]?.split("/")[0] ?? ""
    if (segment && !/^[0-9a-f-]{36}$/i.test(segment)) {
      return "/admin/reports?status=pending"
    }
  }
  return trimmed
}

/**
 * 管理ダッシュボードの KPI カード用リンク。
 * Next.js Link でサーバー遷移し、href を admin 配下に限定する。
 */
export function AdminStatCardLink({ href, children }: Props) {
  const safeHref = sanitizeAdminHref(href)

  return (
    <Link
      href={safeHref}
      prefetch={false}
      scroll
      className="block rounded-xl text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
    >
      {children}
    </Link>
  )
}
