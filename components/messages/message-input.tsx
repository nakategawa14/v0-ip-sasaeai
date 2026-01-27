"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Crown } from "lucide-react"
import { sendMessage } from "@/lib/actions/messages"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Link from "next/link"

interface MessageInputProps {
  matchId: string
  userGender: string
  membershipStatus: string
}

export function MessageInput({ matchId, userGender, membershipStatus }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const enablePaidMessaging = process.env.NEXT_PUBLIC_ENABLE_PAID_MESSAGING === "true"
  const isPaidMember = membershipStatus === "paid"
  const isFreeMale = userGender === "male" && !isPaidMember
  const canSendMessage = !enablePaidMessaging || !isFreeMale

  const handleSend = async () => {
    if (!message.trim() || sending) return

    if (enablePaidMessaging && isFreeMale) {
      setShowPremiumModal(true)
      return
    }

    setSending(true)
    try {
      await sendMessage(matchId, message)
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      if (error instanceof Error && error.message === "PREMIUM_REQUIRED") {
        setShowPremiumModal(true)
      } else {
        alert("メッセージの送信に失敗しました")
      }
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
    <>
      <div className="p-4 border-t bg-background">
        {enablePaidMessaging && isFreeMale && (
          <Alert className="mb-3 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
            <Crown className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-sm">
              メッセージの受信・閲覧は可能ですが、送信には
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
            placeholder={
              enablePaidMessaging && isFreeMale ? "メッセージの送信には有料プランが必要です..." : "メッセージを入力..."
            }
            className="resize-none min-h-[60px] max-h-[120px]"
            disabled={sending || (enablePaidMessaging && isFreeMale)}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending || (enablePaidMessaging && isFreeMale)}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {enablePaidMessaging && isFreeMale
            ? "有料プランに登録してメッセージを送信"
            : "Enterで送信、Shift+Enterで改行"}
        </p>

        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-gray-400">
            有料メッセージ機能: {enablePaidMessaging ? "有効" : "無効（全員送信可能）"}
          </p>
        )}
      </div>

      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              有料プランへのアップグレードが必要です
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <Alert>
                <AlertDescription>
                  無料プランの男性会員は、メッセージの受信・閲覧は可能ですが、メッセージの送信には有料プランへのアップグレードが必要です。
                </AlertDescription>
              </Alert>
              <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">有料プラン</h3>
                <p className="text-2xl font-bold mb-2">月額1,000円</p>
                <p className="text-sm text-gray-600 mb-2">クーポン利用で500円</p>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>✓ メッセージ送信無制限</li>
                  <li>✓ すべての機能が利用可能</li>
                  <li>✓ 機能制限なし</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPremiumModal(false)} className="flex-1">
                  キャンセル
                </Button>
                <Link href="/upgrade" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                    有料プランに登録
                  </Button>
                </Link>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
