import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { redirect } from "next/navigation"
import { GroupChatMessageList } from "@/components/group-chat/group-chat-message-list"
import { GroupChatInput } from "@/components/group-chat/group-chat-input"
import { GroupChatParticipants } from "@/components/group-chat/group-chat-participants"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"

export default async function GroupChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  try {
    const { data: currentUserProfile } = await supabase
      .from(TABLES.PROFILES)
      .select("id, nickname, gender, membership_status")
      .eq("id", user.id)
      .single()

    if (!currentUserProfile) {
      redirect("/profile/setup")
    }

    const { data: room, error: roomError } = await supabase
      .from(TABLES.GROUP_CHAT_ROOMS)
      .select("*")
      .eq("id", roomId)
      .single()

    if (roomError || !room) {
      console.error("[v0] Room not found:", roomError)
      return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">チャットルームが見つかりません</h1>
            <Link href="/group-chat">
              <Button>チャット一覧に戻る</Button>
            </Link>
          </Card>
        </div>
      )
    }

    const now = new Date()
    const endTime = room.scheduled_end_time ? new Date(room.scheduled_end_time) : null
    const isEnded = endTime && now > endTime

    const startTime = room.scheduled_start_time ? new Date(room.scheduled_start_time) : null
    const hasNotStarted = startTime && now < startTime

    if (hasNotStarted) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">このチャットルームはまだ開始されていません</h1>
            <p className="text-gray-600 mb-4">
              {room.name} は{" "}
              {startTime.toLocaleString("ja-JP", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}{" "}
              から開始します。
            </p>
            <Link href="/group-chat">
              <Button>チャット一覧に戻る</Button>
            </Link>
          </Card>
        </div>
      )
    }

    if (isEnded || room.status === "closed") {
      return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">このチャットルームは終了しました</h1>
            <p className="text-gray-600 mb-4">{room.name} は終了しました。他のアクティブなルームをご利用ください。</p>
            <Link href="/group-chat">
              <Button>チャット一覧に戻る</Button>
            </Link>
          </Card>
        </div>
      )
    }

    const { data: isParticipant } = await supabase
      .from(TABLES.GROUP_CHAT_PARTICIPANTS)
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!isParticipant) {
      redirect("/group-chat")
    }

    const { data: messages } = await supabase
      .from(TABLES.GROUP_CHAT_MESSAGES)
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100)

    const { data: participantsData } = await supabase
      .from(TABLES.GROUP_CHAT_PARTICIPANTS)
      .select("*")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: false })

    const senderIds = messages?.map((m) => m.sender_id) || []
    const participantIds = participantsData?.map((p) => p.user_id) || []
    const allUserIds = [...new Set([...senderIds, ...participantIds])]

    let profileMap = new Map()

    if (allUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from(TABLES.PROFILES)
        .select("id, nickname, gender")
        .in("id", allUserIds)

      if (profilesError) {
        console.error("[v0] Error fetching profiles:", profilesError)
      } else if (profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]))
      }
    }

    const messagesWithProfiles =
      messages?.map((msg) => ({
        ...msg,
        sasaeai_profiles: profileMap.get(msg.sender_id) || { id: msg.sender_id, nickname: "Unknown", gender: "other" },
      })) || []

    const participants =
      participantsData?.map((p) => ({
        ...p,
        sasaeai_profiles: profileMap.get(p.user_id) || { id: p.user_id, nickname: "Unknown", gender: "other" },
      })) || []

    const canSendMessage = true

    return (
      <div className="container mx-auto px-4 py-4 max-w-6xl h-[calc(100vh-80px)] flex flex-col">
        {/* ヘッダー */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-3">
            <Link href="/group-chat" className="hover:opacity-70">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                <h2 className="font-semibold text-lg">{room.name}</h2>
              </div>
              {room.description && <p className="text-sm text-gray-600 mt-1">{room.description}</p>}
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-medium">{participants.length}</span> 名参加中
            </div>
          </div>
        </Card>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* メッセージエリア */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-hidden">
              <GroupChatMessageList messages={messagesWithProfiles} currentUserId={user.id} roomId={roomId} />
            </div>
            <GroupChatInput roomId={roomId} canSendMessage={canSendMessage} userGender={currentUserProfile.gender} />
          </div>

          {/* 参加者リスト（デスクトップのみ） */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <GroupChatParticipants participants={participants} currentUserId={user.id} roomId={roomId} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("[v0] Error loading room:", error)
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-4">チャットルームの読み込み中にエラーが発生しました。</p>
          <Link href="/group-chat">
            <Button>チャット一覧に戻る</Button>
          </Link>
        </Card>
      </div>
    )
  }
}
