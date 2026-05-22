import Link from "next/link"
import type { ReactNode } from "react"
import { isValidReportId } from "@/lib/admin/auth"

type Props = {
  href: string
  children: ReactNode
}

/**
 * 管理ダッシュボード KPI 用 href の正規化。
 * 不正な値で /admin に戻らないよう、通報系は一覧 /admin/reports にフォールバックする。
 */
export function normalizeAdminStatHref(href: string): string {
  const trimmed = (href ?? "").trim()

  if (!trimmed.startsWith("/admin")) {
    return "/admin/reports"
  }

  if (trimmed === "/admin/reports" || trimmed.startsWith("/admin/reports?")) {
    return trimmed
  }

  if (trimmed.startsWith("/admin/reports/")) {
    const segment = trimmed.slice("/admin/reports/".length).split("?")[0]?.split("/")[0] ?? ""
    if (segment && isValidReportId(segment)) {
      return trimmed
    }
    return "/admin/reports?status=pending"
  }

  return trimmed
}

/**
 * 管理ダッシュボードの KPI カード用リンク（Server Component から渡す href をそのまま使用可能）。
 */
export function AdminStatCardLink({ href, children }: Props) {
  const safeHref = normalizeAdminStatHref(href)

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
