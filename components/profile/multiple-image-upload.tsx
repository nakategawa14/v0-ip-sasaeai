"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Upload, X, Camera, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MultipleImageUploadProps {
  label: string
  description?: string
  helpText?: string
  currentImages?: string[]
  maxImages?: number
  imageType: "profile" | "verification" | "selfie"
  onImagesChange: (urls: string[]) => void
  enableCamera?: boolean
}

export function MultipleImageUpload({
  label,
  description,
  helpText,
  currentImages = [],
  maxImages = 3,
  imageType,
  onImagesChange,
  enableCamera = false,
}: MultipleImageUploadProps) {
  const [images, setImages] = useState<string[]>(currentImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    setImages(currentImages)
  }, [currentImages])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = maxImages - images.length
    if (remainingSlots <= 0) {
      setError(`最大${maxImages}枚までアップロードできます`)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const filesToUpload = Array.from(files).slice(0, remainingSlots)
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", imageType)

        const response = await fetch("/api/profile/upload-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("アップロードに失敗しました")
        }

        const data = await response.json()
        return data.url
      })

      const newUrls = await Promise.all(uploadPromises)
      const updatedImages = [...images, ...newUrls]
      setImages(updatedImages)
      onImagesChange(updatedImages)
    } catch (err) {
      console.error("[v0] 画像アップロードエラー:", err)
      setError(err instanceof Error ? err.message : "アップロードに失敗しました")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)

    setImages(newImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    onImagesChange(images)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        {helpText && <p className="mt-1 text-sm font-medium text-blue-600">{helpText}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative aspect-square cursor-move"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="absolute left-2 top-2 z-10 rounded-full bg-white/80 p-1 shadow-md">
              <GripVertical className="h-4 w-4 text-gray-600" />
            </div>
            {index === 0 && (
              <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-pink-500 px-2 py-1 text-xs font-semibold text-white shadow-md">
                メイン
              </div>
            )}
            <img
              src={url || "/placeholder.svg"}
              alt={`画像 ${index + 1}`}
              className="h-full w-full rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute -right-2 -top-2 z-10 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-pink-400 hover:bg-pink-50">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              {...(enableCamera ? { capture: "environment" } : {})}
            />
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">{uploading ? "アップロード中..." : "画像を選択"}</span>
          </label>
        )}
      </div>

      {images.length > 1 && (
        <p className="text-xs text-gray-500">💡 画像をドラッグして並び替えできます（1枚目がメイン画像になります）</p>
      )}

      {enableCamera && images.length < maxImages && (
        <Button
          type="button"
          variant="outline"
          className="w-full bg-transparent"
          onClick={() => {
            const input = document.createElement("input")
            input.type = "file"
            input.accept = "image/*"
            input.capture = "user"
            input.onchange = (e) => handleFileChange(e as any)
            input.click()
          }}
        >
          <Camera className="mr-2 h-4 w-4" />
          カメラで撮影
        </Button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-gray-500">
        {images.length} / {maxImages}枚アップロード済み
      </p>
    </div>
  )
}
