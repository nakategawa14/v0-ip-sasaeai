"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createGroupChatRoom } from "@/lib/actions/group-chat"
import { useToast } from "@/hooks/use-toast"

const CATEGORIES = [
  { value: "general", label: "雑談" },
  { value: "disability", label: "障がいについて" },
  { value: "health", label: "健康・病気" },
  { value: "welfare", label: "福祉・制度" },
  { value: "work", label: "仕事・就労" },
  { value: "daily_life", label: "日常生活" },
  { value: "relationship", label: "恋愛・人間関係" },
  { value: "regional", label: "地域別" },
  { value: "other", label: "その他" },
]

const MAX_PARTICIPANTS_OPTIONS = [5, 10]

export function CreateRoomForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "general",
    maxParticipants: 10,
    hasSchedule: false,
    scheduledStartTime: "",
    scheduledEndTime: "",
  })

  const handleStartTimeChange = (startTime: string) => {
    console.log("[v0] Start time selected:", startTime)
    if (startTime) {
      const start = new Date(startTime)
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // 2時間後
      const endTimeString = end.toISOString().slice(0, 16)
      console.log("[v0] Calculated end time:", endTimeString)
      setFormData({
        ...formData,
        scheduledStartTime: startTime,
        scheduledEndTime: endTimeString,
      })
    } else {
      setFormData({
        ...formData,
        scheduledStartTime: startTime,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const params = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        maxParticipants: formData.maxParticipants,
        scheduledStartTime:
          formData.hasSchedule && formData.scheduledStartTime ? new Date(formData.scheduledStartTime) : undefined,
        scheduledEndTime:
          formData.hasSchedule && formData.scheduledEndTime ? new Date(formData.scheduledEndTime) : undefined,
      }

      const room = await createGroupChatRoom(params)

      toast({
        title: "ルームを作成しました",
        description: "参加者を待ちましょう",
      })

      router.push(`/group-chat/${room.id}`)
    } catch (error) {
      console.error("[v0] Create room error:", error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "ルームの作成に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">ルーム名 *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="例: 障害年金について語ろう"
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="このルームについて簡単に説明してください"
          rows={4}
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">カテゴリー</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxParticipants">定員（最大10名）</Label>
        <Select
          value={formData.maxParticipants.toString()}
          onValueChange={(value) => setFormData({ ...formData, maxParticipants: Number.parseInt(value) })}
        >
          <SelectTrigger id="maxParticipants">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MAX_PARTICIPANTS_OPTIONS.map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num}名
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="hasSchedule"
            checked={formData.hasSchedule}
            onChange={(e) => setFormData({ ...formData, hasSchedule: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="hasSchedule" className="cursor-pointer">
            開催時間を指定する（最大2時間）
          </Label>
        </div>

        {formData.hasSchedule && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledStartTime">開始時間</Label>
              <Input
                id="scheduledStartTime"
                type="datetime-local"
                value={formData.scheduledStartTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                required={formData.hasSchedule}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledEndTime">終了時間（自動設定：2時間後）</Label>
              <Input
                id="scheduledEndTime"
                type="datetime-local"
                value={formData.scheduledEndTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scheduledEndTime: e.target.value,
                  })
                }
                required={formData.hasSchedule}
              />
              <p className="text-xs text-gray-500">※開始時間を選択すると自動的に2時間後に設定されます</p>
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "作成中..." : "ルームを作成"}
      </Button>
    </form>
  )
}
