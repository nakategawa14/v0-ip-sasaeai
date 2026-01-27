"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, Loader2 } from "lucide-react"

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    checkSupport()
  }, [])

  async function checkSupport() {
    // ブラウザがプッシュ通知をサポートしているか確認
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsSupported(false)
      setIsLoading(false)
      return
    }

    setIsSupported(true)
    setPermission(Notification.permission)

    // 既存の購読を確認
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error("購読確認エラー:", error)
    }

    setIsLoading(false)
  }

  async function handleToggle(checked: boolean) {
    if (checked) {
      await subscribe()
    } else {
      await unsubscribe()
    }
  }

  async function subscribe() {
    setIsLoading(true)

    try {
      // 通知の許可を要求
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission !== "granted") {
        setIsLoading(false)
        return
      }

      // VAPID公開鍵を取得
      const vapidResponse = await fetch("/api/push/vapid-key")
      const { publicKey } = await vapidResponse.json()

      if (!publicKey) {
        console.error("VAPID公開鍵が設定されていません")
        setIsLoading(false)
        return
      }

      // Service Workerを取得
      const registration = await navigator.serviceWorker.ready

      // プッシュ購読を作成
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // サーバーに購読情報を送信
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (response.ok) {
        setIsSubscribed(true)
      }
    } catch (error) {
      console.error("購読エラー:", error)
    }

    setIsLoading(false)
  }

  async function unsubscribe() {
    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // サーバーから購読を削除
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        // ブラウザの購読を解除
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
    } catch (error) {
      console.error("購読解除エラー:", error)
    }

    setIsLoading(false)
  }

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 text-gray-500">
        <BellOff className="h-5 w-5" />
        <span className="text-sm">お使いのブラウザはプッシュ通知に対応していません</span>
      </div>
    )
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-3 text-amber-600">
        <BellOff className="h-5 w-5" />
        <span className="text-sm">通知がブロックされています。ブラウザの設定から許可してください。</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isSubscribed ? <Bell className="h-5 w-5 text-blue-600" /> : <BellOff className="h-5 w-5 text-gray-400" />}
        <Label htmlFor="push-toggle" className="cursor-pointer">
          {isSubscribed ? "プッシュ通知: オン" : "プッシュ通知: オフ"}
        </Label>
      </div>
      <div className="flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        <Switch id="push-toggle" checked={isSubscribed} onCheckedChange={handleToggle} disabled={isLoading} />
      </div>
    </div>
  )
}

// Base64 URLをUint8Arrayに変換
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
