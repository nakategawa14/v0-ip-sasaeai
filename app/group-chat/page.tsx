import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TABLES } from "@/lib/supabase/table-names"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { GroupChatRoomList } from "@/components/group-chat/group-chat-room-list"
import { MessageSquarePlus, Crown, Users } from "lucide-react"
import Link from "next/link"

export default async function GroupChatPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  if (!profile || !profile.nickname) {
    redirect("/profile/setup")
  }

  console.log("[v0] Fetching rooms with is_active=true")

  // グループチャットルーム一覧を取得
  const { data: rooms, error: roomsError } = await supabase
    .from(TABLES.GROUP_CHAT_ROOMS)
    .select("*")
    .eq("is_active", true)
    .order("is_official", { ascending: false })
    .order("scheduled_start_time", { ascending: true })

  console.log("[v0] Rooms query result:", { rooms, error: roomsError })
  console.log("[v0] Number of rooms found:", rooms?.length || 0)

  // 各ルームの最新メッセージと参加状況、参加者数を取得
  const roomsWithDetails = await Promise.all(
    (rooms || []).map(async (room) => {
      // host情報を取得
      let hostInfo = null
      if (room.host_id) {
        const { data: hostProfile } = await supabase
          .from(TABLES.PROFILES)
          .select("nickname, profile_images")
          .eq("id", room.host_id)
          .single()
        hostInfo = hostProfile
      }

      // 最新メッセージの取得
      const { data: lastMessage } = await supabase
        .from(TABLES.GROUP_CHAT_MESSAGES)
        .select("content, created_at, sender_id")
        .eq("room_id", room.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // 最新メッセージの送信者情報を取得
      let senderInfo = null
      if (lastMessage?.sender_id) {
        const { data: senderProfile } = await supabase
          .from(TABLES.PROFILES)
          .select("nickname")
          .eq("id", lastMessage.sender_id)
          .single()
        senderInfo = senderProfile
      }

      let isParticipant = false
      try {
        const { data: participantData, error: participantError } = await supabase
          .from(TABLES.GROUP_CHAT_PARTICIPANTS)
          .select("id")
          .eq("room_id", room.id)
          .eq("user_id", user.id)
          .single()

        if (!participantError) {
          isParticipant = !!participantData
        }
      } catch (e) {
        console.error("[v0] Error checking participant:", e)
      }

      const { count: participantCount } = await supabase
        .from(TABLES.GROUP_CHAT_PARTICIPANTS)
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id)

      return {
        ...room,
        host: hostInfo,
        lastMessage: lastMessage
          ? {
              ...lastMessage,
              sender: senderInfo,
            }
          : null,
        isParticipant,
        participant_count: participantCount || 0,
      }
    }),
  )

  const { data: adminCheck } = await supabase
    .from(TABLES.PROFILES)
    .select("id")
    .eq("id", user.id)
    .eq("is_admin", true)
    .single()

  const isAdmin = !!adminCheck
  const canCreateRoom = profile.gender === "female" || profile.membership_status === "paid" || isAdmin

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">グループチャット</h1>
          <p className="text-gray-600">みんなで楽しく会話しましょう</p>
        </div>

        {!canCreateRoom && (
          <Card className="mb-6 border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50 p-6">
            <div className="flex items-start gap-4">
              <Crown className="h-8 w-8 text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">グループチャットに参加するには</h3>
                <p className="text-gray-700 mb-4">
                  グループチャットへの参加とメッセージ送信は、女性会員と有料男性会員のみご利用いただけます。
                </p>
                <p className="text-sm text-gray-600 mb-4">※テスト期間中は、一部機能を体験できます</p>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500" asChild disabled>
                  <Link href="/upgrade">有料プランに登録（準備中）</Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-purple-500" />
                  <h2 className="text-xl font-semibold">アクティブなチャットルーム</h2>
                </div>
                {canCreateRoom && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/group-chat/create">
                      <MessageSquarePlus className="h-4 w-4 mr-2" />
                      ルーム作成
                    </Link>
                  </Button>
                )}
              </div>

              <GroupChatRoomList rooms={roomsWithDetails} canParticipate={canCreateRoom} />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="font-semibold mb-4">グループチャットについて</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-900 mb-1">参加条件</p>
                  <p>女性会員と有料男性会員が参加できます</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">ルーム作成</p>
                  <p>時間指定・定員設定可能なライブチャット枠を作成できます</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">プロフィール閲覧</p>
                  <p>参加者のアイコンをクリックすると、プロフィールが見れます</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">自動クローズ</p>
                  <p>終了時間または48時間非アクティブで自動的にクローズされます</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
