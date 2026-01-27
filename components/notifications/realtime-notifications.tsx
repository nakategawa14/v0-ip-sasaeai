"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { TABLES } from "@/lib/supabase/table-names"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"
import Link from "next/link"
import type { Notification } from "@/lib/actions/notifications"

interface RealtimeNotificationsProps {
  userId: string
  initialUnreadCount: number
}

export function RealtimeNotifications({ userId, initialUnreadCount }: RealtimeNotificationsProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    const fetchRecentNotifications = async () => {
      const { data: notifications } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (notifications && notifications.length > 0) {
        const relatedUserIds = [...new Set(notifications.map((n) => n.related_user_id).filter(Boolean))]

        if (relatedUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from(TABLES.PROFILES)
            .select("id, nickname, display_name, profile_images")
            .in("id", relatedUserIds)

          const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

          const notificationsWithProfiles = notifications.map((notification) => ({
            ...notification,
            related_profile: notification.related_user_id ? profileMap.get(notification.related_user_id) : null,
          }))

          setRecentNotifications(notificationsWithProfiles as Notification[])
        } else {
          setRecentNotifications(notifications as Notification[])
        }
      }
    }

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)

      if (count !== null) {
        setUnreadCount(count)
      }
    }

    fetchRecentNotifications()

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TABLES.NOTIFICATIONS,
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[v0] New notification received:", payload)
          setUnreadCount((prev) => prev + 1)
          fetchRecentNotifications()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: TABLES.NOTIFICATIONS,
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCount()
          fetchRecentNotifications()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const getNotificationTitle = (notification: Notification) => {
    const relatedProfile = notification.related_profile as any
    const displayName = relatedProfile?.nickname || relatedProfile?.display_name || "誰か"

    switch (notification.type) {
      case "like_received":
        return `${displayName}さんからいいねが届きました`
      case "match":
        return `${displayName}さんとマッチングしました！`
      case "message":
        return `${displayName}さんからメッセージが届きました`
      case "profile_view":
        return `${displayName}さんがあなたのプロフィールを見ました`
      default:
        return notification.title
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>通知</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount}件の未読
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">通知はありません</div>
        ) : (
          <>
            {recentNotifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild className="cursor-pointer">
                <Link href={notification.link || "/notifications"} className="block">
                  <div className={`p-2 ${!notification.is_read ? "bg-blue-50" : ""}`}>
                    <p className="text-sm font-medium">{getNotificationTitle(notification)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ja,
                      })}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="w-full text-center">
                <span className="text-sm text-primary">すべての通知を見る</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
