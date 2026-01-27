"use client"

import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Product {
  id: string
  title: string
  price: string
  image: string
  link: string
  platform: "amazon" | "rakuten"
}

interface ProductCarouselProps {
  products?: Product[]
}

export function ProductCarousel({ products }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // デモ用サンプル商品（実際のアフィリエイトリンクに置き換えてください）
  const sampleProducts: Product[] = products || [
    {
      id: "1",
      title: "バリアフリー関連商品",
      price: "¥3,980",
      image: "/placeholder.svg?height=200&width=200",
      link: "https://www.amazon.co.jp/?tag=YOUR_AFFILIATE_ID",
      platform: "amazon",
    },
    {
      id: "2",
      title: "健康グッズ",
      price: "¥2,480",
      image: "/placeholder.svg?height=200&width=200",
      link: "https://room.rakuten.co.jp/YOUR_ROOM_ID",
      platform: "rakuten",
    },
    {
      id: "3",
      title: "介護用品",
      price: "¥5,280",
      image: "/placeholder.svg?height=200&width=200",
      link: "https://www.amazon.co.jp/?tag=YOUR_AFFILIATE_ID",
      platform: "amazon",
    },
  ]

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % sampleProducts.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + sampleProducts.length) % sampleProducts.length)
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="font-semibold mb-1">おすすめ商品</h3>
        <p className="text-xs text-muted-foreground">格安でのサービス提供のため、広告閲覧にご協力ください</p>
      </div>

      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {sampleProducts.map((product) => (
              <div key={product.id} className="min-w-full">
                <a href={product.link} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="aspect-square relative mb-3 bg-muted rounded-lg overflow-hidden">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-medium text-sm mb-1 line-clamp-2">{product.title}</h4>
                  <p className="text-primary font-semibold mb-2">{product.price}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{product.platform}</span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>

        {sampleProducts.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2"
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <div className="flex justify-center gap-1 mt-4">
        {sampleProducts.map((_, index) => (
          <button
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </Card>
  )
}
