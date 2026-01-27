"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"

interface OptimizedImageProps {
  src: string | null | undefined
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  containerClassName?: string
  priority?: boolean
  showFallback?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  containerClassName,
  priority = false,
  showFallback = true,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    if (!showFallback) return null
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100",
          containerClassName,
        )}
      >
        <User className="h-12 w-12 text-gray-400" />
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* ローディングスケルトン */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      )}

      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={cn("transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100", className)}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        sizes={fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined}
      />
    </div>
  )
}
