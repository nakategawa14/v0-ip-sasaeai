"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { sendContactMessage } from "@/lib/actions/account"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MessageCircle } from "lucide-react"

export function ContactSupportButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !message.trim()) {
      toast({
        title: "エラー",
        description: "件名とメッセージを入力してください",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const result = await sendContactMessage(message, subject)

    if (result.error) {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    toast({
      title: "送信完了",
      description: "運営にメッセージを送信しました。返信をお待ちください。",
    })

    setSubject("")
    setMessage("")
    setOpen(false)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-transparent">
          <MessageCircle className="mr-2 h-4 w-4" />
          運営にメッセージを送る
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>運営にメッセージを送る</DialogTitle>
            <DialogDescription>お問い合わせ、ご要望、不具合報告などをお送りください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="subject">件名</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="例: プロフィール更新について"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="message">メッセージ</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="お問い合わせ内容をご記入ください"
                rows={5}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                "送信"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
