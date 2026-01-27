"use client"

import { useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { TABLES } from "@/lib/supabase/table-names"
import { markAsRead } from "@/lib/actions/messages"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Message {
  id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  matchId: string
  partnerName: string
}

export function MessageList({ messages: initialMessages, currentUserId, matchId, partnerName }: MessageListProps) {
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
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TABLES.MESSAGES,
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, supabase])

  // 既読処理
  useEffect(() => {
    const unreadMessages = messages.filter((msg) => !msg.is_read && msg.sender_id !== currentUserId)

    if (unreadMessages.length > 0) {
      markAsRead(unreadMessages.map((msg) => msg.id))
    }
  }, [messages, currentUserId])

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwn = message.sender_id === currentUserId

        return (
          <div key={message.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
            {!isOwn && (
              <Avatar className="w-8 h-8">
                <AvatarFallback>{partnerName[0]}</AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <Card className={`p-3 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
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
