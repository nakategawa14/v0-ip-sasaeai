"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { TABLES } from "@/lib/supabase/table-names"
import { sendGroupChatMessage, leaveGroupChat } from "@/lib/actions/group-chat"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Users, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  sender_nickname: string
  sender_image: string | null
}

interface GroupChatRoomViewProps {
  roomId: string
  roomName: string
  canSendMessage: boolean
}

export function GroupChatRoomView({ roomId, roomName, canSendMessage }: GroupChatRoomViewProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [userCache, setUserCache] = useState<Map<string, { nickname: string; profile_image_1: string | null }>>(
    new Map(),
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    loadMessages()
    loadParticipantCount()

    // リアルタイム購読
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TABLES.GROUP_CHAT_MESSAGES,
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any

          // ユーザー情報を取得
          let senderInfo = userCache.get(newMsg.sender_id)
          if (!senderInfo) {
            const { data: profile } = await supabase
              .from(TABLES.PROFILES)
              .select("nickname, profile_image_1")
              .eq("id", newMsg.sender_id)
              .single()

            if (profile) {
              senderInfo = profile
              setUserCache((prev) => new Map(prev).set(newMsg.sender_id, profile))
            }
          }

          const formattedMsg: Message = {
            id: newMsg.id,
            content: newMsg.content,
            created_at: newMsg.created_at,
            sender_id: newMsg.sender_id,
            sender_nickname: senderInfo?.nickname || "不明",
            sender_image: senderInfo?.profile_image_1 || null,
          }

          setMessages((prev) => [...prev, formattedMsg])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadMessages = async () => {
    const { data: rawMessages } = await supabase
      .from(TABLES.GROUP_CHAT_MESSAGES)
      .select("id, content, created_at, sender_id")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100)

    if (rawMessages && rawMessages.length > 0) {
      // 送信者IDを収集
      const senderIds = [...new Set(rawMessages.map((m) => m.sender_id))]

      // ユーザー情報を取得
      const { data: profiles } = await supabase
        .from(TABLES.PROFILES)
        .select("id, nickname, profile_image_1")
        .in("id", senderIds)

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

      // キャッシュを更新
      const newCache = new Map(userCache)
      profiles?.forEach((p) => {
        newCache.set(p.id, { nickname: p.nickname, profile_image_1: p.profile_image_1 })
      })
      setUserCache(newCache)

      // メッセージを整形
      const formattedMessages: Message[] = rawMessages.map((msg) => {
        const profile = profileMap.get(msg.sender_id)
        return {
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          sender_id: msg.sender_id,
          sender_nickname: profile?.nickname || "不明",
          sender_image: profile?.profile_image_1 || null,
        }
      })

      setMessages(formattedMessages)
    }
  }

  const loadParticipantCount = async () => {
    const { count } = await supabase
      .from(TABLES.GROUP_CHAT_PARTICIPANTS)
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)

    if (count !== null) {
      setParticipantCount(count)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !canSendMessage) return

    setSending(true)
    try {
      await sendGroupChatMessage(roomId, newMessage)
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      alert(error instanceof Error ? error.message : "メッセージの送信に失敗しました")
    } finally {
      setSending(false)
    }
  }

  const handleLeaveRoom = async () => {
    if (!confirm("このルームから退出しますか？")) return

    try {
      await leaveGroupChat(roomId)
      router.push("/group-chat")
      router.refresh()
    } catch (error) {
      console.error("Error leaving room:", error)
      alert("退出に失敗しました")
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* ヘッダー */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/group-chat">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900">{roomName}</h1>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              <span>{participantCount}名が参加中</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLeaveRoom}>
          <LogOut className="h-4 w-4 mr-1" />
          退出
        </Button>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={message.sender_image || "/placeholder.svg"} />
              <AvatarFallback>{message.sender_nickname[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{message.sender_nickname}</span>
                <span className="text-xs text-gray-500">
                  {new Date(message.created_at).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-700 break-words">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="bg-white border-t p-4 flex-shrink-0">
        {canSendMessage ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim() || sending} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="text-center text-sm text-gray-500 py-2">メッセージの送信には有料プランが必要です</div>
        )}
      </div>
    </div>
  )
}
