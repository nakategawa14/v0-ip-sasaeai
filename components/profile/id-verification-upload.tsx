"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, Shield, CheckCircle2, Info } from "lucide-react"
import Image from "next/image"
import { IdCropTool } from "./id-crop-tool"
import { Progress } from "@/components/ui/progress"

interface IdVerificationUploadProps {
  label?: string
  description?: string
  currentImageUrl?: string
  value?: string
  onImageChange: (url: string) => void
  onUploadStart?: () => void
  onUploadComplete?: () => void
}

export function IdVerificationUpload({
  label = "本人確認書類",
  description,
  currentImageUrl,
  value,
  onImageChange,
  onUploadStart,
  onUploadComplete,
}: IdVerificationUploadProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState(value || currentImageUrl || "")
  const [error, setError] = useState("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(objectUrl)
  }

  const handleCropComplete = (
    croppedBlob: Blob,
    cropArea: { x: number; y: number; width: number; height: number },
    idType: string,
  ) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError("")
    setSelectedFile(null)

    onUploadStart?.()

    // 進捗シミュレーション
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 200)
    ;(async () => {
      try {
        const formData = new FormData()
        formData.append("file", croppedBlob, `id_verification_${idType}_${Date.now()}.jpg`)
        formData.append("type", "id_verification")

        const response = await fetch("/api/profile/upload-image", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "アップロードに失敗しました")
        }

        const data = await response.json()
        onImageChange(data.url)
        setPreviewUrl(data.url)

        if (selectedFile) {
          URL.revokeObjectURL(selectedFile)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "アップロードに失敗しました")
      } finally {
        setIsUploading(false)
        setTimeout(() => setUploadProgress(0), 500)
        onUploadComplete?.()
      }
    })()
  }

  const handleCancel = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile)
    }
    setSelectedFile(null)
    setError("")
  }

  const handleRemove = () => {
    setPreviewUrl("")
    onImageChange("")
  }

  if (selectedFile) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <IdCropTool imageSrc={selectedFile} onCropComplete={handleCropComplete} onCancel={handleCancel} />
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>アップロード中... {uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {label && <Label className="text-base font-semibold">{label}</Label>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-200 dark:from-blue-950/50 dark:to-indigo-950/50 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-3 flex-1">
            <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
              プライバシー保護について
            </p>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>取得する情報</strong>：生年月日と顔写真のみ
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>保存しない情報</strong>：氏名・住所・免許番号・マイナンバー
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>トリミング機能</strong>：必要な範囲のみを選択して保存できます
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">アップロードの手順</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>下のボタンから本人確認書類の画像を選択</li>
              <li>書類タイプ（運転免許証/マイナンバーカード）を選択</li>
              <li>緑の枠で顔写真と生年月日のみを囲む</li>
              <li>「範囲を確定」ボタンをクリック</li>
              <li>プロフィール画面で「プロフィールを更新」をクリックして保存</li>
            </ol>
          </div>
        </div>
      </div>

      {previewUrl ? (
        <div className="relative inline-block">
          <div className="relative h-48 w-64 overflow-hidden rounded-lg border shadow-sm">
            <Image src={previewUrl || "/placeholder.svg"} alt={label} fill className="object-cover" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-8 w-8 rounded-full shadow-md"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex h-48 w-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 transition-all hover:border-blue-500 hover:bg-blue-100/50 dark:border-blue-700 dark:bg-blue-950/20 dark:hover:border-blue-500 dark:hover:bg-blue-950/40">
          <input type="file" accept="image/*" onChange={handleFileSelect} disabled={isUploading} className="hidden" />
          <div className="flex flex-col items-center gap-3 text-blue-600 dark:text-blue-400">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/50">
              <Upload className="h-8 w-8" />
            </div>
            <span className="text-sm font-medium">画像を選択</span>
            <span className="text-xs text-muted-foreground">JPG, PNG（10MB以下）</span>
          </div>
        </label>
      )}

      {isUploading && (
        <div className="space-y-2 w-64">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>アップロード中... {uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
