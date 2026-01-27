"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"
import { TABLES } from "@/lib/supabase/table-names"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface SimpleProfileEditFormProps {
  profile: any
  profileDetails: any
}

export function SimpleProfileEditForm({ profile, profileDetails }: SimpleProfileEditFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  const parseProfileImages = (images: any): string[] => {
    if (!images) return []
    if (Array.isArray(images)) return images
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images)
        return Array.isArray(parsed) ? parsed : []
      } catch (e) {
        console.error("[v0] Failed to parse profile_images:", e)
        return []
      }
    }
    return []
  }

  const [nickname, setNickname] = useState(profile.nickname || "")
  const [bio, setBio] = useState(profile.bio || "")
  const [profileImages, setProfileImages] = useState<string[]>(parseProfileImages(profile.profile_images))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const currentImageCount = profileImages.length
    const availableSlots = 3 - currentImageCount

    if (availableSlots <= 0) {
      alert("プロフィール画像は最大3枚までです")
      return
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots)
    setUploadingImages(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "profile")

        const response = await fetch("/api/profile/upload-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("画像のアップロードに失敗しました")
        }

        const data = await response.json()
        uploadedUrls.push(data.url)
      }

      setProfileImages([...profileImages, ...uploadedUrls])
    } catch (error) {
      console.error("[v0] Error uploading images:", error)
      alert("画像のアップロードに失敗しました")
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setProfileImages(profileImages.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] Updating profile:", {
        id: profile.id,
        nickname,
        bio,
        profileImages,
        currentUserType: profile.user_type,
      })

      const { error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .update({
          nickname,
          bio,
          profile_images: profileImages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)

      if (profileError) {
        console.error("[v0] Profile update error details:", profileError)
        throw profileError
      }

      alert("プロフィールを更新しました")
      router.push(`/profile/${profile.id}`)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      alert("プロフィールの更新に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Label>プロフィール画像（最大3枚）</Label>
            <div className="mt-2 grid grid-cols-3 gap-4">
              {profileImages.map((url, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-lg border">
                  <Image
                    src={url || "/placeholder.svg"}
                    alt={`プロフィール画像${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {profileImages.length < 3 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">画像を追加</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {uploadingImages && <p className="mt-2 text-sm text-blue-600">アップロード中...</p>}
          </div>

          <div>
            <Label htmlFor="nickname">ニックネーム *</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ニックネームを入力"
              required
            />
          </div>

          <div>
            <Label htmlFor="bio">自己紹介</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="自己紹介を入力してください"
              rows={5}
            />
            <p className="mt-1 text-sm text-gray-500">自己PR文は詳しく書くとマッチ率が上がります</p>
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "更新中..." : "プロフィールを更新"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/profile/${profile.id}`)}
          disabled={loading}
        >
          キャンセル
        </Button>
      </div>
    </form>
  )
}
