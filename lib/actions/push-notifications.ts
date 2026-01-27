"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import webpush from "web-push"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@sasaeai.help"

// VAPID鍵が設定されている場合のみ初期化
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export async function sendPushNotification(userId: string, title: string, body: string, url?: string) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("VAPID鍵が設定されていないため、プッシュ通知をスキップします")
    return { success: false, error: "VAPID鍵が設定されていません" }
  }

  const supabase = await createServerSupabaseClient()

  // ユーザーの購読情報を取得
  const { data: subscriptions, error: fetchError } = await supabase
    .from("sasaeai_push_subscriptions")
    .select("*")
    .eq("user_id", userId)

  if (fetchError) {
    console.error("購読情報取得エラー:", fetchError)
    return { success: false, error: fetchError.message }
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { success: false, error: "購読情報がありません" }
  }

  const payload = JSON.stringify({
    title,
    body,
    url: url || "/",
  })

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        await webpush.sendNotification(pushSubscription, payload)
        return { success: true, id: sub.id }
      } catch (error: any) {
        // 購読が無効になった場合は削除
        if (error.statusCode === 404 || error.statusCode === 410) {
          await supabase.from("sasaeai_push_subscriptions").delete().eq("id", sub.id)
        }
        return { success: false, id: sub.id, error: error.message }
      }
    }),
  )

  const successCount = results.filter((r) => r.status === "fulfilled" && r.value.success).length

  return { success: successCount > 0, sentCount: successCount, totalCount: subscriptions.length }
}

export async function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY || null
}
