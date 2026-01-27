import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"
import { redirect } from "next/navigation"
import { MessageList } from "@/components/messages/message-list"
import { MessageInput } from "@/components/messages/message-input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { ReportButton } from "@/components/profile/report-button"
import { Button } from "@/components/ui/button"

export default async function MessagePage({ params }: { params: Promise<{ matchId: string }> }) {
  console.log("[v0 Message] === MESSAGE PAGE START ===")

  const { matchId } = await params
  console.log("[v0 Message] Received matchId from params:", matchId)
  console.log("[v0 Message] matchId type:", typeof matchId)

  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0 Message] Current user:", user?.id)

  if (!user) {
    console.log("[v0 Message] No user found, redirecting to login")
    redirect("/login")
  }

  const { data: currentUserProfile, error: profileError } = await supabase
    .from(TABLES.PROFILES)
    .select("id, gender, is_premium")
    .eq("id", user.id)
    .single()

  console.log("[v0 Message] Current user profile:", currentUserProfile)
  console.log("[v0 Message] Profile error:", profileError)

  console.log("[v0 Message] Querying matches table:", TABLES.MATCHES)
  console.log("[v0 Message] Looking for match with id:", matchId)

  const { data: match, error: matchError } = await supabase
    .from(TABLES.MATCHES)
    .select("id, user1_id, user2_id")
    .eq("id", matchId)
    .single()

  console.log("[v0 Message] Match query result:", { match, matchError })

  if (!match) {
    console.error("[v0 Message] ❌ Match not found!")
    console.error("[v0 Message] - matchId:", matchId)
    console.error("[v0 Message] - error:", matchError)
    console.error("[v0 Message] - error code:", matchError?.code)
    console.error("[v0 Message] - error message:", matchError?.message)

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <AlertCircle className="w-16 h-16 text-destructive" />
            <h1 className="text-2xl font-bold">マッチが見つかりません</h1>
            <p className="text-muted-foreground">このマッチは存在しないか、削除された可能性があります。</p>
            <p className="text-sm text-muted-foreground">マッチID: {matchId}</p>
            {matchError && <p className="text-sm text-destructive">エラー: {matchError.message}</p>}
            <Link href="/matches">
              <Button>マッチング一覧に戻る</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  console.log("[v0 Message] Match found:", match)
  console.log("[v0 Message] Match user1_id:", match.user1_id)
  console.log("[v0 Message] Match user2_id:", match.user2_id)
  console.log("[v0 Message] Current user id:", user.id)

  const isUser1 = match.user1_id === user.id
  const isUser2 = match.user2_id === user.id
  console.log("[v0 Message] Is user1?", isUser1)
  console.log("[v0 Message] Is user2?", isUser2)

  if (!isUser1 && !isUser2) {
    console.error("[v0 Message] ❌ User not authorized for this match!")
    console.error("[v0 Message] - userId:", user.id)
    console.error("[v0 Message] - match.user1_id:", match.user1_id)
    console.error("[v0 Message] - match.user2_id:", match.user2_id)
    redirect("/matches")
  }

  const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id
  console.log("[v0 Message] Partner ID:", partnerId)

  const { data: partnerProfile, error: partnerError } = await supabase
    .from(TABLES.PROFILES)
    .select("id, nickname, profile_images, is_verified")
    .eq("id", partnerId)
    .single()

  console.log("[v0 Message] Partner profile:", partnerProfile)
  console.log("[v0 Message] Partner error:", partnerError)

  console.log("[v0 Message] Querying messages for match:", matchId)
  const { data: messages, error: messagesError } = await supabase
    .from(TABLES.MESSAGES)
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true })

  console.log("[v0 Message] Messages count:", messages?.length || 0)
  console.log("[v0 Message] Messages error:", messagesError)
  console.log("[v0 Message] === MESSAGE PAGE END ===")

  const partnerImages = (() => {
    try {
      if (typeof partnerProfile?.profile_images === "string") {
        return JSON.parse(partnerProfile.profile_images)
      }
      return Array.isArray(partnerProfile?.profile_images) ? partnerProfile.profile_images : []
    } catch {
      return []
    }
  })()

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl h-[calc(100vh-80px)] flex flex-col">
      {/* ヘッダー */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="hover:opacity-70">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Avatar className="w-12 h-12">
            <AvatarImage src={partnerImages[0] || undefined} alt={partnerProfile?.nickname} />
            <AvatarFallback>{partnerProfile?.nickname?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-lg">{partnerProfile?.nickname || "名前未設定"}</h2>
              {partnerProfile?.is_verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
            </div>
          </div>
          <ReportButton profileId={partnerProfile?.id || ""} variant="ghost" size="sm" />
        </div>
      </Card>

      {/* メッセージリスト */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages || []}
          currentUserId={user.id}
          matchId={matchId}
          partnerName={partnerProfile?.nickname || "相手"}
        />
      </div>

      {/* メッセージ入力 */}
      <MessageInput
        matchId={matchId}
        userGender={currentUserProfile?.gender || ""}
        isPremium={currentUserProfile?.is_premium || false}
      />
    </div>
  )
}
