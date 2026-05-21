"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Ban, CheckCircle } from "lucide-react"
import { TABLES } from "@/lib/supabase/table-names"
import { adminUnblockUser } from "@/lib/actions/moderation"
import { BlockUserButton } from "@/components/admin/block-user-button"

export function AdminUserActions({ user }: { user: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [unblockBusy, setUnblockBusy] = useState(false)

  const platformBlocked = user?.status === "blocked"

  const [suspensionReason, setSuspensionReason] = useState("")
  const [suspensionDetails, setSuspensionDetails] = useState("")
  const [suspensionType, setSuspensionType] = useState("temporary")
  const [suspendedUntil, setSuspendedUntil] = useState("")

  const handleSuspend = async () => {
    if (!suspensionReason) {
      setError("停止理由を入力してください")
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    const supabase = createClient()

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        setError("認証エラーが発生しました")
        return
      }

      // ユーザーを停止
      const { error: updateError } = await supabase.from(TABLES.PROFILES).update({ is_active: false }).eq("id", user.id)

      if (updateError) {
        setError("ユーザーの停止に失敗しました")
        return
      }

      try {
        await supabase.from(TABLES.SUSPENSION_HISTORY).insert({
          user_id: user.id,
          suspended_by: currentUser.id,
          reason: suspensionReason,
          details: suspensionDetails || null,
          suspension_type: suspensionType,
          suspended_until: suspensionType === "temporary" && suspendedUntil ? suspendedUntil : null,
          is_active: true,
        })
      } catch (err) {
        // テーブルが存在しない場合はスキップ
      }

      try {
        await supabase.from(TABLES.MODERATION_LOGS).insert({
          moderator_id: currentUser.id,
          action: "suspend",
          target_user_id: user.id,
          target_resource_type: "user",
          target_resource_id: user.id,
          reason: suspensionReason,
          details: { suspension_type: suspensionType, suspended_until: suspendedUntil },
        })
      } catch (err) {
        // テーブルが存在しない場合はスキップ
      }

      setSuccess("ユーザーを停止しました")
      setSuspensionReason("")
      setSuspensionDetails("")
      router.refresh()
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleUnsuspend = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    const supabase = createClient()

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        setError("認証エラーが発生しました")
        return
      }

      // ユーザーを再有効化
      const { error: updateError } = await supabase.from(TABLES.PROFILES).update({ is_active: true }).eq("id", user.id)

      if (updateError) {
        setError("ユーザーの再有効化に失敗しました")
        return
      }

      try {
        await supabase
          .from(TABLES.SUSPENSION_HISTORY)
          .update({
            is_active: false,
            lifted_at: new Date().toISOString(),
            lifted_by: currentUser.id,
          })
          .eq("user_id", user.id)
          .eq("is_active", true)
      } catch (err) {
        // テーブルが存在しない場合はスキップ
      }

      try {
        await supabase.from(TABLES.MODERATION_LOGS).insert({
          moderator_id: currentUser.id,
          action: "unsuspend",
          target_user_id: user.id,
          target_resource_type: "user",
          target_resource_id: user.id,
          reason: "停止解除",
        })
      } catch (err) {
        // テーブルが存在しない場合はスキップ
      }

      setSuccess("ユーザーの停止を解除しました")
      router.refresh()
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handlePlatformUnblock = async () => {
    setError(null)
    setSuccess(null)
    setUnblockBusy(true)
    const res = await adminUnblockUser(user.id)
    setUnblockBusy(false)
    if (!res.success) {
      setError(res.error ?? "ブロック解除に失敗しました")
      return
    }
    setSuccess("プラットフォームブロックを解除しました")
    router.refresh()
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-semibold">管理者アクション</h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {success && <Alert className="mb-4 border-green-500 bg-green-50 text-green-900">{success}</Alert>}

      {platformBlocked ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            このユーザーは <strong>status: blocked</strong> のため、アプリからアクセスできません。
          </Alert>
          <Button onClick={() => void handlePlatformUnblock()} disabled={unblockBusy} className="w-full">
            <CheckCircle className="mr-2 h-4 w-4" />
            {unblockBusy ? "処理中…" : "プラットフォームブロックを解除"}
          </Button>
        </div>
      ) : user.is_active ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="suspensionReason">停止理由</Label>
            <Textarea
              id="suspensionReason"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="ユーザーを停止する理由を入力してください"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="suspensionDetails">詳細（任意）</Label>
            <Textarea
              id="suspensionDetails"
              value={suspensionDetails}
              onChange={(e) => setSuspensionDetails(e.target.value)}
              placeholder="詳細情報"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="suspensionType">停止タイプ</Label>
            <Select value={suspensionType} onValueChange={setSuspensionType} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temporary">一時停止</SelectItem>
                <SelectItem value="permanent">永久停止</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {suspensionType === "temporary" && (
            <div>
              <Label htmlFor="suspendedUntil">停止期限</Label>
              <Input
                id="suspendedUntil"
                type="date"
                value={suspendedUntil}
                onChange={(e) => setSuspendedUntil(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <Button onClick={handleSuspend} disabled={loading} className="w-full" variant="destructive">
            <Ban className="mr-2 h-4 w-4" />
            ユーザーを停止
          </Button>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">
              通報対応などで利用停止する場合は「ブロック」。停止（上）とは別に、<strong>status</strong> を blocked にします。
            </p>
            <BlockUserButton userId={user.id} userLabel={user.nickname || user.display_name || user.id} className="w-full" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert variant="destructive">このユーザーは現在停止中です</Alert>
          <Button onClick={handleUnsuspend} disabled={loading} className="w-full">
            <CheckCircle className="mr-2 h-4 w-4" />
            停止を解除
          </Button>
        </div>
      )}
    </Card>
  )
}
