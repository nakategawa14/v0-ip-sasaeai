"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Flag, Loader2 } from "lucide-react"
import { reportUser, type ReportType } from "@/lib/actions/report"
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
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"

interface ReportButtonProps {
  profileId: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: "inappropriate_profile",
    label: "不適切なプロフィール",
    description: "プロフィール内容や画像が不適切",
  },
  {
    value: "harassment",
    label: "嫌がらせ・迷惑行為",
    description: "しつこいメッセージや嫌がらせ",
  },
  {
    value: "scam",
    label: "詐欺・金銭要求",
    description: "お金を要求された、詐欺的な行為",
  },
  {
    value: "fake_profile",
    label: "なりすまし・偽アカウント",
    description: "他人になりすましている",
  },
  {
    value: "spam",
    label: "スパム・宣伝",
    description: "宣伝目的のアカウント",
  },
  {
    value: "other",
    label: "その他",
    description: "上記に当てはまらない問題",
  },
]

export function ReportButton({ profileId, variant = "ghost", size = "default", className }: ReportButtonProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<ReportType>("inappropriate_profile")
  const [description, setDescription] = useState("")

  const handleSubmit = async () => {
    if (!description || description.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "詳細は10文字以上入力してください",
      })
      return
    }

    setLoading(true)

    try {
      const result = await reportUser(profileId, reportType, description)

      if (result.error) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: result.error,
        })
      } else {
        toast({
          title: "報告を受け付けました",
          description: result.message ?? "管理人に通知しました。確認までお待ちください。",
        })
        setOpen(false)
        setDescription("")
        setReportType("inappropriate_profile")
      }
    } catch (error) {
      console.error("[v0] Error submitting report:", error)
      toast({
        variant: "destructive",
        title: "エラー",
        description: "報告の送信に失敗しました",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Flag className="mr-2 h-4 w-4" />
          報告
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ユーザーを報告</DialogTitle>
          <DialogDescription>
            このユーザーの問題を報告してください。運営が確認し、適切な対応を行います。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>報告理由</Label>
            <RadioGroup value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              {REPORT_TYPES.map((type) => (
                <div key={type.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                  <Label htmlFor={type.value} className="cursor-pointer font-normal">
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">詳細（10文字以上）</Label>
            <Textarea
              id="description"
              placeholder="具体的な問題を詳しく説明してください..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">{description.length} / 10文字以上</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={loading || description.trim().length < 10}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            報告する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
