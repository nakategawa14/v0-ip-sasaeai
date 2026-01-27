"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { User, Send, Lock } from "lucide-react"
import Link from "next/link"
import { TABLES } from "@/lib/supabase/table-names"

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

interface MessageThreadProps {
  match: any
  currentUserId: string
  currentProfile: any
}

export function MessageThread({ match, currentUserId, currentProfile }: MessageThreadProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const otherUser = match.user1.id === currentUserId ? match.user2 : match.user1

  const enablePaidMessaging = process.env.NEXT_PUBLIC_ENABLE_PAID_MESSAGING === "true"
  const isPaidMember = currentProfile.membership_status === "paid"
  const canSendMessage = !enablePaidMessaging || isPaidMember || currentProfile.gender !== "male"

  // メッセージを取得
  useEffect(() => {
    console.log("[v0] MessageThread: Fetching messages for match:", match.id)

    const fetchMessages = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from(TABLES.MESSAGES)
          .select("*")
          .eq("match_id", match.id)
          .order("created_at", { ascending: true })

        console.log("[v0] MessageThread: Fetched messages:", data?.length || 0)

        if (error) {
          console.error("[v0] MessageThread: Error fetching messages:", error)
          setError("メッセージの取得に失敗しました")
          return
        }

        if (data) {
          setMessages(data)
          // 受信メッセージを既読にする
          await supabase
            .from(TABLES.MESSAGES)
            .update({ is_read: true })
            .eq("match_id", match.id)
            .eq("receiver_id", currentUserId)
            .eq("is_read", false)

          router.refresh()
        }
      } catch (err) {
        console.error("[v0] MessageThread: Exception fetching messages:", err)
        setError("エラーが発生しました")
      }
    }

    fetchMessages()

    // リアルタイムサブスクリプション
    const supabase = createClient()
    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sasaeai_messages",
          filter: `match_id=eq.${match.id}`,
        },
        (payload) => {
          console.log("[v0] MessageThread: New message received:", payload.new)
          setMessages((prev) => [...prev, payload.new as Message])
          // 自分が送信したメッセージでない場合、既読にする
          if (payload.new.receiver_id === currentUserId) {
            supabase.from(TABLES.MESSAGES).update({ is_read: true }).eq("id", payload.new.id)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [match.id, currentUserId, router])

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    if (!canSendMessage) {
      setError("メッセージの送信には有料プランへの登録が必要です")
      return
    }

    console.log("[v0] MessageThread: Sending message:", newMessage.trim())

    setLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from(TABLES.MESSAGES).insert({
        match_id: match.id,
        sender_id: currentUserId,
        receiver_id: otherUser.id,
        content: newMessage.trim(),
      })

      if (error) {
        console.error("[v0] MessageThread: Error sending message:", error)
        setError("メッセージの送信に失敗しました")
        return
      }

      console.log("[v0] MessageThread: Message sent successfully")
      setNewMessage("")
    } catch (err) {
      console.error("[v0] MessageThread: Exception sending message:", err)
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex h-[600px] flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <Link href={`/profile/${otherUser.id}`} className="font-semibold text-gray-900 hover:text-pink-600">
              {otherUser.nickname}
            </Link>
          </div>
        </div>
      </div>

      {/* メッセージリスト */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => {
          const isSent = message.sender_id === currentUserId

          return (
            <div key={message.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isSent ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                <p className={`mt-1 text-xs ${isSent ? "text-pink-100" : "text-gray-500"}`}>
                  {new Date(message.created_at).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="border-t bg-white p-4">
        {error && (
          <Alert variant="destructive" className="mb-3 text-sm">
            {error}
          </Alert>
        )}

        {enablePaidMessaging && !canSendMessage ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <Lock className="mx-auto mb-2 h-6 w-6 text-gray-400" />
            <p className="mb-2 text-sm font-semibold text-gray-700">メッセージの送信には有料プランへの登録が必要です</p>
            <p className="mb-3 text-xs text-gray-500">※受信したメッセージの閲覧は可能です</p>
            <Link href="/upgrade">
              <Button size="sm">有料プランに登録</Button>
            </Link>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="メッセージを入力..."
              disabled={loading}
            />
            <Button onClick={handleSendMessage} disabled={loading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {process.env.NODE_ENV === "development" && (
          <p className="mt-2 text-xs text-gray-400">
            有料メッセージ機能: {enablePaidMessaging ? "有効" : "無効（全員送信可能）"}
          </p>
        )}
      </div>
    </Card>
  )
}
