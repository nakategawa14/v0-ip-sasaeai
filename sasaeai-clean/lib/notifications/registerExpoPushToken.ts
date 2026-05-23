import Constants from "expo-constants"
import * as Device from "expo-device"
//import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

import { TABLES } from "@/lib/constants/tables"
import { supabase } from "@/lib/supabase"

export async function registerExpoPushTokenForUser(userId: string): Promise<void> {
    if (__DEV__) {
        console.log("Skip push token in Expo Go")
        return
      }
  if (Platform.OS !== "web") {
    if (!Device.isDevice) return

    //if (Platform.OS === "android") {
      //await Notifications.setNotificationChannelAsync("default", {
       //name: "default",
       // importance: //Notifications.AndroidImportance.DEFAULT,
     // })
   // }

    const permissions =  { status: "denied" }
    let finalStatus = permissions.status
    if (finalStatus !== "granted") {
      const req = { status: "denied" }
      finalStatus = req.status
    }
    if (finalStatus !== "granted") return

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    if (!projectId) {
      if (__DEV__) {
        console.warn("[push] EAS projectId が見つからないため push token 保存をスキップしました")
      }
      return
    }

    const token = null
    if (!token) return

    const { error } = await supabase.from(TABLES.PROFILES).update({ expo_push_token: token }).eq("id", userId)
    if (error && __DEV__) {
      console.warn("[push] expo_push_token update failed:", error.message)
    }
  }
}
