"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert } from "@/components/ui/alert"
import { Loader2, Mail, MessageSquare, UserX } from "lucide-react"
import { OPERATOR_INFO } from "@/lib/legal/operator-info"
import {
  adminForceDeactivateUser,
  adminSendOfficialDm,
  adminSendWarningEmail,
} from "@/lib/actions/admin-report-operations"
import { useToast } from "@/hooks/use-toast"

type LogRow = {
  id: string
  action_type: string
  created_at: string
  admin_nickname?: string
  notes?: string | null
  details?: Record<string, unknown> | null
}

export function AdminOperationsPanel({
  reportId,
  targetUserId,
  targetEmail,
  targetNickname,
  moderationLogs,
}: {
  reportId: string
  targetUserId: string
  targetEmail: string | null
  targetNickname: string
  moderationLogs: LogRow[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [dmBody, setDmBody] = useState("")
  const [mailSubject, setMailSubject] = useState("【ささえ愛】アカウントに関する重要なお知らせ")
  const [mailBody, setMailBody] = useState("")
  const [dmLoading, setDmLoading] = useState(false)
  const [mailLoading, setMailLoading] = useState(false)
  const [forceLoading, setForceLoading] = useState(false)
  const [mailConfirmOpen, setMailConfirmOpen] = useState(false)
  const [forceConfirmOpen, setForceConfirmOpen] = useState(false)

  const sendDm = async () => {
    setDmLoading(true)
    const res = await adminSendOfficialDm({ targetUserId, reportId, body: dmBody })
    setDmLoading(false)
    if (!res.success) {
      toast({ title: "送信に失敗しました", description: res.error, variant: "destructive" })
      return
    }
    toast({ title: "送信しました", description: "運営名義でアプリ内メッセージを送りました。" })
    setDmBody("")
    router.refresh()
  }

  const sendMail = async () => {
    if (!targetEmail?.trim()) {
      toast({ title: "メールがありません", description: "対象ユーザーの登録メールが取得できません。", variant: "destructive" })
      return
    }
    setMailLoading(true)
    const res = await adminSendWarningEmail({
      targetUserId,
      targetEmail,
      reportId,
      subject: mailSubject,
      body: mailBody,
    })
    setMailLoading(false)
    setMailConfirmOpen(false)
    if (!res.success) {
      toast({ title: "送信に失敗しました", description: res.error, variant: "destructive" })
      return
    }
    toast({ title: "メールを送信しました" })
    setMailBody("")
    router.refresh()
  }

  const forceDeactivate = async () => {
    setForceLoading(true)
    const res = await adminForceDeactivateUser({ targetUserId, reportId })
    setForceLoading(false)
    setForceConfirmOpen(false)
    if (!res.success) {
      toast({ title: "処理に失敗しました", description: res.error, variant: "destructive" })
      return
    }
    if ("warning" in res && res.warning) {
      toast({ title: "一部完了", description: res.warning, variant: "destructive" })
    } else {
      toast({ title: "強制退会を実行しました", description: "アカウントを無効化し、セッションを切りました。" })
    }
    router.refresh()
  }

  return (
    <>
      <Card className="border-indigo-200 bg-indigo-50/40 p-6">
        <h3 className="mb-1 text-lg font-semibold text-indigo-950">運営操作パネル</h3>
        <p className="mb-6 text-sm text-indigo-900/80">
          対象ユーザーへの公式連絡・メール・強制退会です。実行内容はモデレーションログに記録されます。
        </p>

        <div className="space-y-8">
          <div>
            <div className="mb-2 flex items-center gap-2 font-medium text-gray-900">
              <MessageSquare className="h-4 w-4" />
              メッセージ送信（運営事務局名義）
            </div>
            <p className="mb-2 text-xs text-gray-600">
              運営用アカウント（<code className="rounded bg-white px-1">SASAEAI_OPERATIONS_USER_ID</code>
              ）と対象ユーザーとのマッチを自動作成し、メッセージを1通送信します。表示名は運営プロフィールのニックネームに依存します。
            </p>
            <Label htmlFor="ops-dm">本文</Label>
            <Textarea
              id="ops-dm"
              value={dmBody}
              onChange={(e) => setDmBody(e.target.value)}
              rows={4}
              placeholder="お知らせ内容を入力…"
              className="mt-1"
            />
            <Button className="mt-2" disabled={dmLoading || !dmBody.trim()} onClick={() => void sendDm()}>
              {dmLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              アプリ内に送信
            </Button>
          </div>

          <div className="border-t border-indigo-200 pt-6">
            <div className="mb-2 flex items-center gap-2 font-medium text-gray-900">
              <Mail className="h-4 w-4" />
              メール送信（注意喚起）
            </div>
            <p className="mb-2 text-xs text-gray-600">
              送信元表示名: {OPERATOR_INFO.name} / 返信先: {OPERATOR_INFO.email}
              （実際の from アドレスは <code className="rounded bg-white px-1">MAILERSEND_FROM_EMAIL</code> 等の検証済みドメインになります）
            </p>
            {!targetEmail?.trim() ? (
              <Alert>登録メールが取得できないため送信できません。</Alert>
            ) : (
              <>
                <div className="mb-2">
                  <Label htmlFor="mail-to">送信先</Label>
                  <Input id="mail-to" value={targetEmail} readOnly className="mt-1 bg-white" />
                </div>
                <div className="mb-2">
                  <Label htmlFor="mail-subj">件名</Label>
                  <Input
                    id="mail-subj"
                    value={mailSubject}
                    onChange={(e) => setMailSubject(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Label htmlFor="mail-body">本文</Label>
                <Textarea
                  id="mail-body"
                  value={mailBody}
                  onChange={(e) => setMailBody(e.target.value)}
                  rows={5}
                  className="mt-1"
                  placeholder="注意喚起の内容…"
                />
                <Button
                  variant="secondary"
                  className="mt-2"
                  disabled={mailLoading || !mailBody.trim()}
                  onClick={() => setMailConfirmOpen(true)}
                >
                  送信内容を確認する
                </Button>
              </>
            )}
          </div>

          <div className="border-t border-indigo-200 pt-6">
            <div className="mb-2 flex items-center gap-2 font-medium text-red-800">
              <UserX className="h-4 w-4" />
              強制退会
            </div>
            <p className="mb-2 text-xs text-gray-600">
              プロフィールを無効化し、Auth ユーザーを長期 ban してリフレッシュトークンを無効化します（
              {targetNickname}）。
            </p>
            <Button variant="destructive" onClick={() => setForceConfirmOpen(true)}>
              強制退会を実行
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={mailConfirmOpen} onOpenChange={setMailConfirmOpen}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>メールを送信しますか？</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left text-sm text-gray-800">
                <p>
                  <span className="font-medium">宛先:</span> {targetEmail}
                </p>
                <p>
                  <span className="font-medium">件名:</span> {mailSubject}
                </p>
                <div>
                  <span className="font-medium">本文:</span>
                  <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded border bg-gray-50 p-2 text-xs">
                    {mailBody}
                  </pre>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mailLoading}>キャンセル</AlertDialogCancel>
            <Button type="button" onClick={() => void sendMail()} disabled={mailLoading}>
              {mailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              送信する
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={forceConfirmOpen} onOpenChange={setForceConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>強制退会の確認</AlertDialogTitle>
            <AlertDialogDescription>
              {targetNickname} のアカウントを無効化し、ログインセッションを強制終了します。取り消しには別途 Auth の ban 解除とプロフィール復旧が必要です。よろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={forceLoading}>キャンセル</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={() => void forceDeactivate()} disabled={forceLoading}>
              {forceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              実行する
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">この通報のモデレーションログ</h3>
        {moderationLogs.length === 0 ? (
          <p className="text-sm text-gray-600">まだ記録がありません。</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {moderationLogs.map((log) => (
              <li key={log.id} className="rounded-md border bg-white p-3">
                <div className="flex flex-wrap items-center gap-2 text-gray-800">
                  <span className="font-medium">{actionLabel(log.action_type)}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString("ja-JP")} · 管理者: {log.admin_nickname ?? "—"}
                  </span>
                </div>
                {log.notes ? <p className="mt-1 text-xs text-gray-600">{log.notes}</p> : null}
                {log.details && Object.keys(log.details).length > 0 ? (
                  <pre className="mt-2 max-h-32 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

function actionLabel(type: string): string {
  const map: Record<string, string> = {
    admin_official_dm: "運営公式メッセージ送信",
    admin_warning_email: "注意喚起メール送信",
    user_forced_deactivation: "強制退会",
    warning_issued: "警告を発行",
    user_suspended: "ユーザーを一時停止",
    report_resolved: "通報を解決",
    report_dismissed: "通報を却下",
  }
  return map[type] ?? type
}
