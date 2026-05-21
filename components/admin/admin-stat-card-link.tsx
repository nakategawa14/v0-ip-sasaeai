"use client"

import Link from "next/link"
import type { ReactNode } from "react"

type Props = {
  href: string
  children: ReactNode
}

/**
 * 管理ダッシュボードの KPI カード用リンク。
 * block 表示と prefetch 無効化で、カード全体のタップとクライアント遷移を安定させる。
 */
export function AdminStatCardLink({ href, children }: Props) {
  return (
    <Link
      href={href}
      prefetch={false}
      scroll
      className="block rounded-xl text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
    >
      {children}
    </Link>
  )
}
