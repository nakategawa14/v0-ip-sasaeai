"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Crown } from "lucide-react"
import { sendGroupChatMessage } from "@/lib/actions/group-chat"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

interface GroupChatInputProps {
  roomId: string
  canSendMessage: boolean
  userGender: string
}

export function GroupChatInput({ roomId, canSendMessage, userGender }: GroupChatInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!message.trim() || sending) return

    if (!canSendMessage) {
      alert("メッセージの送信には有料プランが必要です")
      return
    }

    setSending(true)
    try {
      await sendGroupChatMessage(roomId, message)
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } catch (error) {
      console.error("[v0] Error sending group chat message:", error)
      alert(error instanceof Error ? error.message : "メッセージの送信に失敗しました")
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t bg-background">
      {!canSendMessage && (
        <Alert className="mb-3 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
          <Crown className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-sm">
            グループチャットでのメッセージ送信には
            <Link href="/upgrade" className="font-semibold text-pink-600 hover:underline mx-1">
              有料プラン
            </Link>
            への登録が必要です
          </AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={canSendMessage ? "メッセージを入力..." : "メッセージの送信には有料プランが必要です..."}
          className="resize-none min-h-[60px] max-h-[120px]"
          disabled={sending || !canSendMessage}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || sending || !canSendMessage}
          size="icon"
          className="h-[60px] w-[60px]"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {canSendMessage ? "Enterで送信、Shift+Enterで改行" : "有料プランに登録してメッセージを送信"}
      </p>
    </div>
  )
}
