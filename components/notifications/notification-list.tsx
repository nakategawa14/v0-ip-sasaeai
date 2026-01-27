"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"
import { Bell, Heart, MessageCircle, Eye, Check, Trash2, ShieldCheck, ShieldX, UserCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "@/lib/actions/notifications"
import type { Notification } from "@/lib/actions/notifications"

interface NotificationListProps {
  notifications: Notification[]
}

export function NotificationList({ notifications }: NotificationListProps) {
  const [optimisticNotifications, setOptimisticNotifications] = useState(notifications)

  const handleMarkAsRead = async (notificationId: string) => {
    // 楽観的更新
    setOptimisticNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))

    await markNotificationAsRead(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    // 楽観的更新
    setOptimisticNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

    await markAllNotificationsAsRead()
  }

  const handleDelete = async (notificationId: string) => {
    // 楽観的更新
    setOptimisticNotifications((prev) => prev.filter((n) => n.id !== notificationId))

    await deleteNotification(notificationId)
  }

  const unreadCount = optimisticNotifications.filter((n) => !n.is_read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "profile_view":
        return <Eye className="h-5 w-5 text-blue-500" />
      case "like_received":
        return <Heart className="h-5 w-5 text-pink-500" />
      case "match":
        return <Heart className="h-5 w-5 text-red-500" />
      case "message":
        return <MessageCircle className="h-5 w-5 text-green-500" />
      case "verification_request":
        return <UserCheck className="h-5 w-5 text-orange-500" />
      case "verification_approved":
        return <ShieldCheck className="h-5 w-5 text-green-600" />
      case "verification_rejected":
        return <ShieldX className="h-5 w-5 text-red-500" />
      case "system":
        return <Bell className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return ""
    switch (type) {
      case "verification_request":
        return "bg-orange-50"
      case "verification_approved":
        return "bg-green-50"
      case "verification_rejected":
        return "bg-red-50"
      default:
        return "bg-blue-50"
    }
  }

  if (optimisticNotifications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Bell className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="text-gray-600">通知はありません</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">未読: {unreadCount}件</p>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            全て既読にする
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {optimisticNotifications.map((notification) => {
          const relatedProfile = notification.related_profile as any
          const displayName = relatedProfile?.nickname || relatedProfile?.display_name || "ユーザー"

          return (
            <Card
              key={notification.id}
              className={`p-4 ${getNotificationBgColor(notification.type, notification.is_read)}`}
            >
              <div className="flex items-start gap-4">
                {/* アイコン */}
                <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>

                {/* プロフィール画像 */}
                {relatedProfile && (
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={relatedProfile.profile_image_url || ""} alt={displayName} />
                    <AvatarFallback>{displayName[0]}</AvatarFallback>
                  </Avatar>
                )}

                {/* 通知内容 */}
                <div className="flex-1">
                  <h3 className="font-semibold">{notification.title}</h3>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </p>

                  {notification.link && (
                    <Link
                      href={notification.link}
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      詳細を見る
                    </Link>
                  )}
                </div>

                {/* アクション */}
                <div className="flex flex-col gap-2">
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="既読にする"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(notification.id)} title="削除">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
