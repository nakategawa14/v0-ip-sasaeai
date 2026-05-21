import { redirect, notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import Link from "next/link"
import { LikeButton } from "@/components/profile/like-button"
import { ProfileView } from "@/components/profile/profile-view"
import { BlockButton } from "@/components/profile/block-button"
import { ReportButton } from "@/components/profile/report-button"
import { TABLES } from "@/lib/supabase/table-names"
import { recordProfileView } from "@/lib/actions/profile-views"
import { BottomNav } from "@/components/navigation/bottom-nav"

export default async function ProfileViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === "edit" || id === "setup" || id === "visitors" || id === "examples") {
    redirect(`/profile/${id}`)
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: currentProfile } = await supabase.from(TABLES.PROFILES).select("*").eq("email", user.email).single()

  if (!currentProfile) {
    redirect("/profile/setup")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", id).single()

  console.log("[v0] Profile data:", JSON.stringify(profile, null, 2))

  if (!profile || !profile.is_active) {
    notFound()
  }

  const { data: isBlocked } = await supabase
    .from(TABLES.BLOCKS)
    .select("*")
    .eq("blocker_id", currentProfile.id)
    .eq("blocked_id", id)
    .single()

  if (currentProfile.id !== id) {
    await recordProfileView(id)
  }

  // profile.tagsは配列または文字列の可能性がある
  let profileTags: string[] = []
  if (profile.tags) {
    if (Array.isArray(profile.tags)) {
      profileTags = profile.tags
    } else if (typeof profile.tags === "string") {
      try {
        profileTags = JSON.parse(profile.tags)
      } catch {
        profileTags = []
      }
    }
  }

  const { data: existingLike } = await supabase
    .from(TABLES.LIKES)
    .select("*")
    .eq("from_user_id", currentProfile.id)
    .eq("to_user_id", id)
    .single()

  let isMatched = false
  try {
    // 相互いいねがあるかチェック
    const { data: mutualLike } = await supabase
      .from(TABLES.LIKES)
      .select("*")
      .eq("from_user_id", id)
      .eq("to_user_id", currentProfile.id)
      .single()

    isMatched = !!existingLike && !!mutualLike
  } catch {
    isMatched = false
  }

  let chatRoomId: string | null = null
  if (isMatched) {
    try {
      const { data: chatRoom } = await supabase
        .from(TABLES.CHATS)
        .select("id")
        .or(
          `and(user1_id.eq.${currentProfile.id},user2_id.eq.${id}),and(user1_id.eq.${id},user2_id.eq.${currentProfile.id})`,
        )
        .single()

      chatRoomId = chatRoom?.id || null
    } catch {
      chatRoomId = null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={currentProfile} />

      <main className="container mx-auto max-w-4xl px-4 py-8 pb-20 md:pb-8">
        <ProfileView profile={profile} profileTags={profileTags} />

        {/* アクションボタン */}
        <div className="mt-6 flex gap-3">
          <LikeButton profileId={id} currentUserId={currentProfile.id} hasLiked={!!existingLike} className="flex-1" />
          {isMatched && chatRoomId ? (
            <Link href={`/messages/${chatRoomId}`} className="flex-1">
              <Button className="w-full" size="lg">
                <MessageCircle className="mr-2 h-4 w-4" />
                メッセージを送る
              </Button>
            </Link>
          ) : (
            <Button variant="outline" className="flex-1 bg-transparent" size="lg" disabled>
              <MessageCircle className="mr-2 h-4 w-4" />
              マッチング後に送信可能
            </Button>
          )}
        </div>

        <div className="mt-3 flex gap-3">
          <BlockButton profileId={id} isBlocked={!!isBlocked} variant="outline" size="lg" className="flex-1" />
          <ReportButton profileId={id} variant="outline" size="lg" className="flex-1" />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
