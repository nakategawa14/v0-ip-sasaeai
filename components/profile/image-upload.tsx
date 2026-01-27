"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { trimLicenseImage } from "@/lib/utils/image-trim"

interface ImageUploadProps {
  label: string
  description?: string
  currentImageUrl?: string | null
  imageType: "profile" | "id_verification" | "selfie_verification"
  onImageChange: (url: string) => void
  onUploadStart?: () => void
  onUploadComplete?: () => void
  required?: boolean
  value?: string
}

export function ImageUpload({
  label,
  description,
  currentImageUrl,
  imageType,
  onImageChange,
  onUploadStart,
  onUploadComplete,
  required = false,
  value,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(value || currentImageUrl || "")
  const [error, setError] = useState("")

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log("[v0] File selected:", file.name, "imageType:", imageType)

    // ファイルサイズチェック（10MB以下）
    if (file.size > 10 * 1024 * 1024) {
      setError("ファイルサイズは10MB以下にしてください")
      return
    }

    // ファイルタイプチェック
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください")
      return
    }

    setError("")
    setIsUploading(true)
    onUploadStart?.()

    try {
      let fileToUpload = file
      if (imageType === "id_verification") {
        console.log("[v0] Trimming license image for privacy protection...")
        fileToUpload = await trimLicenseImage(file)
        console.log("[v0] License image trimmed successfully, new size:", fileToUpload.size)
      } else {
        console.log("[v0] No trimming needed for imageType:", imageType)
      }

      // プレビュー表示
      const objectUrl = URL.createObjectURL(fileToUpload)
      setPreviewUrl(objectUrl)

      // アップロード
      const formData = new FormData()
      formData.append("file", fileToUpload)
      formData.append("type", imageType)

      const response = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Upload failed:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          imageType,
          fileName: fileToUpload.name,
          fileSize: fileToUpload.size,
        })
        throw new Error(`Upload failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Upload successful:", data)
      onImageChange(data.url)

      // プレビューURLを実際のURLに更新
      URL.revokeObjectURL(objectUrl)
      setPreviewUrl(data.url)
    } catch (err) {
      console.error("Upload error:", err)
      setError("アップロードに失敗しました")
      setPreviewUrl(currentImageUrl || "")
    } finally {
      setIsUploading(false)
      onUploadComplete?.()
    }
  }

  const handleRemove = () => {
    setPreviewUrl("")
    onImageChange("")
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {imageType === "id_verification" && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-semibold">プライバシー保護</p>
          <p className="mt-1">
            ささえ愛は生年月日と顔写真のみ取得します。氏名・住所・免許番号などの個人情報は保存されません。
          </p>
        </div>
      )}

      {previewUrl ? (
        <div className="relative inline-block">
          <div className="relative h-48 w-48 overflow-hidden rounded-lg border">
            <Image src={previewUrl || "/placeholder.svg"} alt={label} fill className="object-cover" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-8 w-8 rounded-full"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex h-48 w-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            required={required && !previewUrl}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">アップロード中...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <span className="text-sm">画像を選択</span>
            </div>
          )}
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
