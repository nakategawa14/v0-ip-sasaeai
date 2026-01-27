"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { RealtimeNotifications } from "@/components/notifications/realtime-notifications"

interface DashboardHeaderProps {
  profile: {
    id: string
    nickname?: string
    display_name?: string
    membership_status: string
  } | null
  initialUnreadCount?: number
}

export function DashboardHeader({ profile, initialUnreadCount = 0 }: DashboardHeaderProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const displayName = profile?.nickname || profile?.display_name || "ユーザー"
  const membershipStatus = profile?.membership_status || "free"

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo className="h-8 w-auto" />
            <span className="text-xl font-bold text-gray-900">ささえ愛</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/search" className="text-gray-700 hover:text-pink-600">
              検索
            </Link>
            <Link href="/likes" className="text-gray-700 hover:text-pink-600">
              いいね
            </Link>
            <Link href="/matches" className="text-gray-700 hover:text-pink-600">
              マッチング
            </Link>
            <Link href="/messages" className="text-gray-700 hover:text-pink-600">
              メッセージ
            </Link>
            <Link href="/group-chat" className="text-gray-700 hover:text-pink-600">
              グループチャット
            </Link>
            <Link href="/profile/visitors" className="text-gray-700 hover:text-pink-600">
              訪問者
            </Link>
            <Link href="/settings/blocks" className="text-gray-700 hover:text-pink-600">
              ブロックリスト
            </Link>
            <Link href="/profile/edit" className="text-gray-700 hover:text-pink-600">
              プロフィール
            </Link>
            <Link href="/profile/examples" className="text-gray-700 hover:text-pink-600">
              プロフィール見本
            </Link>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            {profile?.id && <RealtimeNotifications userId={profile.id} initialUnreadCount={initialUnreadCount} />}
            {membershipStatus === "free" && (
              <Link href="/upgrade">
                <Button size="sm" disabled>
                  有料会員（準備中）
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <Link
                href="/notifications"
                className="flex items-center justify-between text-gray-700 hover:text-pink-600"
              >
                通知
              </Link>
              <Link href="/search" className="text-gray-700 hover:text-pink-600">
                検索
              </Link>
              <Link href="/likes" className="text-gray-700 hover:text-pink-600">
                いいね
              </Link>
              <Link href="/matches" className="text-gray-700 hover:text-pink-600">
                マッチング
              </Link>
              <Link href="/messages" className="text-gray-700 hover:text-pink-600">
                メッセージ
              </Link>
              <Link href="/group-chat" className="text-gray-700 hover:text-pink-600">
                グループチャット
              </Link>
              <Link href="/profile/visitors" className="text-gray-700 hover:text-pink-600">
                訪問者
              </Link>
              <Link href="/settings/blocks" className="text-gray-700 hover:text-pink-600">
                ブロックリスト
              </Link>
              <Link href="/profile/edit" className="text-gray-700 hover:text-pink-600">
                プロフィール
              </Link>
              <Link href="/profile/examples" className="text-gray-700 hover:text-pink-600">
                プロフィール見本
              </Link>
              {membershipStatus === "free" && (
                <Link href="/upgrade">
                  <Button size="sm" className="w-full" disabled>
                    有料会員（準備中）
                  </Button>
                </Link>
              )}
              <Button variant="ghost" onClick={handleLogout} className="justify-start">
                <LogOut className="mr-2 h-5 w-5" />
                ログアウト
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
