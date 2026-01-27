"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface IdCropToolProps {
  imageSrc: string
  onCropComplete: (croppedImage: Blob, cropArea: CropArea, idType: string) => void
  onCancel: () => void
}

export function IdCropTool({ imageSrc, onCropComplete, onCancel }: IdCropToolProps) {
  const [idType, setIdType] = useState<"license" | "mynumber">("license")
  const [cropArea, setCropArea] = useState({ x: 5, y: 10, width: 60, height: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    const updateImageSize = () => {
      if (imageRef.current && containerRef.current) {
        const img = imageRef.current
        const container = containerRef.current
        const containerRect = container.getBoundingClientRect()

        const imageAspect = img.naturalWidth / img.naturalHeight
        const containerAspect = containerRect.width / containerRect.height

        let displayWidth, displayHeight, offsetX, offsetY

        if (imageAspect > containerAspect) {
          displayWidth = containerRect.width
          displayHeight = containerRect.width / imageAspect
          offsetX = 0
          offsetY = (containerRect.height - displayHeight) / 2
        } else {
          displayHeight = containerRect.height
          displayWidth = containerRect.height * imageAspect
          offsetX = (containerRect.width - displayWidth) / 2
          offsetY = 0
        }

        setImageDisplaySize({ width: displayWidth, height: displayHeight, offsetX, offsetY })
      }
    }

    const img = new Image()
    img.src = imageSrc
    img.onload = () => {
      setTimeout(updateImageSize, 100)
    }

    window.addEventListener("resize", updateImageSize)
    return () => window.removeEventListener("resize", updateImageSize)
  }, [imageSrc])

  const handleMouseDown = (e: React.MouseEvent, mode: "drag" | "resize") => {
    e.preventDefault()
    if (mode === "drag") {
      setIsDragging(true)
    } else {
      setIsResizing(true)
    }
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || imageDisplaySize.width === 0) return

      const dx = ((e.clientX - dragStart.x) / imageDisplaySize.width) * 100
      const dy = ((e.clientY - dragStart.y) / imageDisplaySize.height) * 100

      if (isDragging) {
        setCropArea((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(100 - prev.width, prev.x + dx)),
          y: Math.max(0, Math.min(100 - prev.height, prev.y + dy)),
        }))
        setDragStart({ x: e.clientX, y: e.clientY })
      } else if (isResizing) {
        setCropArea((prev) => ({
          ...prev,
          width: Math.max(20, Math.min(100 - prev.x, prev.width + dx)),
          height: Math.max(20, Math.min(100 - prev.y, prev.height + dy)),
        }))
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, imageDisplaySize])

  const createCroppedImage = async () => {
    try {
      const image = new Image()
      image.crossOrigin = "anonymous"
      image.src = imageSrc

      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
      })

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        console.error("[v0] Failed to get canvas context")
        return
      }

      // imageDisplaySizeの状態が古い可能性があるため、元画像のサイズを直接使用
      const pixelCrop = {
        x: Math.round((cropArea.x / 100) * image.naturalWidth),
        y: Math.round((cropArea.y / 100) * image.naturalHeight),
        width: Math.round((cropArea.width / 100) * image.naturalWidth),
        height: Math.round((cropArea.height / 100) * image.naturalHeight),
      }

      console.log("[v0] Crop calculation:", {
        cropAreaPercent: cropArea,
        imageNaturalSize: { width: image.naturalWidth, height: image.naturalHeight },
        pixelCrop,
      })

      // Canvasサイズを設定
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      )

      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log("[v0] Crop complete - blob size:", blob.size)
            onCropComplete(blob, cropArea, idType)
          } else {
            console.error("[v0] Failed to create blob")
          }
        },
        "image/jpeg",
        0.95,
      )
    } catch (e) {
      console.error("[v0] Error creating cropped image:", e)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>書類タイプを選択</Label>
          <RadioGroup value={idType} onValueChange={(v) => setIdType(v as "license" | "mynumber")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="license" id="license" />
              <Label htmlFor="license" className="cursor-pointer">
                運転免許証
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mynumber" id="mynumber" />
              <Label htmlFor="mynumber" className="cursor-pointer">
                マイナンバーカード
              </Label>
            </div>
          </RadioGroup>
        </div>

        {idType === "mynumber" && (
          <div className="rounded-md bg-red-50 border-2 border-red-500 p-4 dark:bg-red-950/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-bold text-red-900 dark:text-red-200">重要：必ず表面を撮影してください</p>
                <p className="text-sm text-red-800 dark:text-red-300">
                  <strong>マイナンバーカードの表面</strong>（顔写真がある面）を撮影してください。
                  <br />
                  裏面（12桁の個人番号が記載されている面）は<strong>絶対に撮影しないでください</strong>。
                  <br />
                  顔写真と生年月日のみを緑の枠内に含めるように調整してください。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>トリミング範囲を調整</Label>
          <div
            ref={containerRef}
            className="relative w-full h-[400px] bg-gray-100 rounded overflow-hidden"
            style={{ touchAction: "none" }}
          >
            <img
              ref={imageRef}
              src={imageSrc || "/placeholder.svg"}
              alt="ID document"
              className="w-full h-full object-contain"
              draggable={false}
            />
            <div
              className="absolute border-4 border-green-500 cursor-move"
              style={{
                left: `${imageDisplaySize.offsetX + (cropArea.x / 100) * imageDisplaySize.width}px`,
                top: `${imageDisplaySize.offsetY + (cropArea.y / 100) * imageDisplaySize.height}px`,
                width: `${(cropArea.width / 100) * imageDisplaySize.width}px`,
                height: `${(cropArea.height / 100) * imageDisplaySize.height}px`,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
              }}
              onMouseDown={(e) => handleMouseDown(e, "drag")}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-bold">保存される範囲</span>
              </div>
              <div
                className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 cursor-se-resize"
                style={{ transform: "translate(50%, 50%)" }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleMouseDown(e, "resize")
                }}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {idType === "mynumber"
              ? "顔写真（左側）と生年月日（中央上部）のみを緑の枠内に含めてください。表面を撮影していることを確認してください。"
              : "顔写真と生年月日が枠内に収まるように調整してください。"}
            枠をドラッグで移動、右下の角をドラッグでサイズ変更できます。
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="button" onClick={createCroppedImage} className="flex-1">
            範囲を確定
          </Button>
          <Button type="button" onClick={onCancel} variant="outline">
            キャンセル
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
