import type React from "react"
import Link from "next/link"
import { requireAdminLayoutSession } from "@/lib/admin/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdminLayoutSession()

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/40">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">管理画面</h2>
        </div>
        <nav className="space-y-1 p-4">
          <Link href="/admin" className="flex items-center rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted">
            ダッシュボード
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            ユーザー管理
          </Link>
          <Link
            href="/admin/verification"
            className="flex items-center rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            本人確認申請
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            通報管理
          </Link>
          <Link
            href="/admin/suspensions"
            className="flex items-center rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            停止中ユーザー
          </Link>
          <Link
            href="/admin/moderation-logs"
            className="flex items-center rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            モデレーションログ
          </Link>
          <Link href="/admin/ads" className="flex items-center rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted">
            広告管理
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            管理者設定
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            ユーザー画面に戻る
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  )
}
