"use client"

import { useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { TABLES } from "@/lib/supabase/table-names"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  sasaeai_profiles?: {
    id: string
    nickname: string
    profile_images: string | string[]
  }
}

interface GroupChatMessageListProps {
  messages: Message[]
  currentUserId: string
  roomId: string
}

export function GroupChatMessageList({ messages: initialMessages, currentUserId, roomId }: GroupChatMessageListProps) {
  const [messages, setMessages] = useState(initialMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient()

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // リアルタイム更新
  useEffect(() => {
    const channel = supabase
      .channel(`group-chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TABLES.GROUP_CHAT_MESSAGES,
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // 送信者のプロフィール情報を取得
          const { data: profile } = await supabase
            .from(TABLES.PROFILES)
            .select("id, nickname, profile_images")
            .eq("id", payload.new.sender_id)
            .single()

          setMessages((prev) => [
            ...prev,
            {
              ...payload.new,
              sasaeai_profiles: profile,
            } as Message,
          ])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  const getProfileImage = (profileImages: string | string[] | undefined) => {
    if (!profileImages) return undefined
    if (typeof profileImages === "string") {
      try {
        const parsed = JSON.parse(profileImages)
        return Array.isArray(parsed) ? parsed[0] : undefined
      } catch {
        return undefined
      }
    }
    return Array.isArray(profileImages) ? profileImages[0] : undefined
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwn = message.sender_id === currentUserId
        const profileImage = getProfileImage(message.sasaeai_profiles?.profile_images)

        return (
          <div key={message.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
            {!isOwn && (
              <Link href={`/profile/${message.sasaeai_profiles?.id}`} className="flex-shrink-0">
                <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-pink-300 transition-all">
                  <AvatarImage src={profileImage || "/placeholder.svg"} alt={message.sasaeai_profiles?.nickname} />
                  <AvatarFallback>{message.sasaeai_profiles?.nickname?.[0] || "?"}</AvatarFallback>
                </Avatar>
              </Link>
            )}
            <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
              {isOwn ? (
                <span className="text-xs text-gray-600">あなた</span>
              ) : (
                <Link
                  href={`/profile/${message.sasaeai_profiles?.id}`}
                  className="text-xs text-gray-600 hover:text-pink-600 hover:underline"
                >
                  {message.sasaeai_profiles?.nickname || "名前未設定"}
                </Link>
              )}
              <Card className={`p-3 ${isOwn ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white" : "bg-muted"}`}>
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              </Card>
              <span className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
