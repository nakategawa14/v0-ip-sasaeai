"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { revalidatePath } from "next/cache"

export interface CreateRoomParams {
  name: string
  description?: string
  category?: string
  maxParticipants?: number
  scheduledStartTime?: Date
  scheduledEndTime?: Date
}

export async function createGroupChatRoom(params: CreateRoomParams) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("認証が必要です")
  }

  // ユーザーの性別と会員ステータスを確認
  const { data: profile } = await supabase
    .from(TABLES.PROFILES)
    .select("gender, membership_status, is_admin")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("プロフィールが見つかりません")
  }

  // 女性、有料男性、または管理者のみが作成可能
  if (profile.gender !== "female" && profile.membership_status !== "paid" && !profile.is_admin) {
    throw new Error("グループチャットの作成には有料プランが必要です")
  }

  const now = new Date()
  const startTime = params.scheduledStartTime
  let roomStatus = "active"

  if (startTime && startTime > now) {
    // 開始時間が未来の場合は "scheduled"
    roomStatus = "scheduled"
  }

  const roomData = {
    name: params.name,
    description: params.description,
    category: params.category,
    max_participants: params.maxParticipants || 50,
    scheduled_start_time: params.scheduledStartTime?.toISOString(),
    scheduled_end_time: params.scheduledEndTime?.toISOString(),
    created_by: user.id,
    host_id: user.id,
    is_official: false,
    is_active: true,
    status: roomStatus,
  }
  console.log("[v0] Creating room with data:", roomData)

  const { data, error } = await supabase.from(TABLES.GROUP_CHAT_ROOMS).insert(roomData).select().single()

  if (error) {
    console.error("[v0] createGroupChatRoom error:", error)
    throw new Error("グループチャットの作成に失敗しました")
  }

  console.log("[v0] Room created successfully:", data)

  // 作成者を参加者として追加
  await joinGroupChat(data.id)

  revalidatePath("/group-chat")
  return data
}

export async function createOfficialRoom(params: CreateRoomParams) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("認証が必要です")
  }

  // 管理者確認
  const { data: profile } = await supabase.from(TABLES.PROFILES).select("is_admin").eq("id", user.id).single()

  if (!profile?.is_admin) {
    throw new Error("管理者のみが公式ルームを作成できます")
  }

  const { data, error } = await supabase
    .from(TABLES.GROUP_CHAT_ROOMS)
    .insert({
      name: params.name,
      description: params.description,
      category: params.category,
      max_participants: params.maxParticipants || 100,
      created_by: user.id,
      host_id: user.id,
      is_official: true,
      is_active: true,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] createOfficialRoom error:", error)
    throw new Error("公式ルームの作成に失敗しました")
  }

  revalidatePath("/group-chat")
  revalidatePath("/admin")
  return data
}

export async function joinGroupChat(roomId: string) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("認証が必要です")
  }

  /*
  const { data: profile } = await supabase
    .from(TABLES.PROFILES)
    .select("gender, membership_status")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("プロフィールが見つかりません")
  }

  if (profile.gender !== "female" && profile.membership_status !== "paid") {
    throw new Error("グループチャットへの参加には有料プランが必要です")
  }
  */

  const { error } = await supabase.from(TABLES.GROUP_CHAT_PARTICIPANTS).insert({
    room_id: roomId,
    user_id: user.id,
  })

  if (error) {
    // 既に参加している場合はエラーを無視
    if (error.code !== "23505") {
      console.error("[v0] joinGroupChat error:", error)
      throw new Error("グループチャットへの参加に失敗しました")
    }
  }

  revalidatePath("/group-chat")
  revalidatePath(`/group-chat/${roomId}`)
}

export async function leaveGroupChat(roomId: string) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("認証が必要です")
  }

  const { error } = await supabase
    .from(TABLES.GROUP_CHAT_PARTICIPANTS)
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", user.id)

  if (error) {
    console.error("[v0] leaveGroupChat error:", error)
    throw new Error("グループチャットからの退出に失敗しました")
  }

  revalidatePath("/group-chat")
  revalidatePath(`/group-chat/${roomId}`)
}

export async function sendGroupChatMessage(roomId: string, content: string) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("認証が必要です")
  }

  if (!content.trim()) {
    throw new Error("メッセージを入力してください")
  }

  /*
  const { data: profile } = await supabase
    .from(TABLES.PROFILES)
    .select("gender, membership_status")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("プロフィールが見つかりません")
  }

  if (profile.gender !== "female" && profile.membership_status !== "paid") {
    throw new Error("メッセージの送信には有料プランが必要です")
  }
  */

  // 参加者かどうか確認
  const { data: participant } = await supabase
    .from(TABLES.GROUP_CHAT_PARTICIPANTS)
    .select("id")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .single()

  if (!participant) {
    throw new Error("グループチャットに参加していません")
  }

  const { error } = await supabase.from(TABLES.GROUP_CHAT_MESSAGES).insert({
    room_id: roomId,
    sender_id: user.id,
    content: content.trim(),
  })

  if (error) {
    console.error("[v0] sendGroupChatMessage error:", error)
    throw new Error("メッセージの送信に失敗しました")
  }

  revalidatePath(`/group-chat/${roomId}`)
}
