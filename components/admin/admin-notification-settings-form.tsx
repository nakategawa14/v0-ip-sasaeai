"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  updateAdminNotificationSettings,
  type AdminNotificationSettings,
  type NotificationFrequency,
} from "@/lib/actions/admin-notifications"
import { Bell, Mail, Clock, FileCheck, Flag, UserPlus, AlertTriangle, Loader2, Check } from "lucide-react"

interface Props {
  initialSettings: AdminNotificationSettings | null
  adminEmail: string
}

export function AdminNotificationSettingsForm({ initialSettings, adminEmail }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  // 設定の状態
  const [frequency, setFrequency] = useState<NotificationFrequency>(
    initialSettings?.notification_frequency || "immediate",
  )
  const [emailEnabled, setEmailEnabled] = useState(initialSettings?.email_notification_enabled ?? true)
  const [notifyVerification, setNotifyVerification] = useState(initialSettings?.notify_new_verification ?? true)
  const [notifyReport, setNotifyReport] = useState(initialSettings?.notify_new_report ?? true)
  const [notifyNewUser, setNotifyNewUser] = useState(initialSettings?.notify_new_user ?? true)
  const [notifyEmailFailure, setNotifyEmailFailure] = useState(initialSettings?.notify_email_failure ?? true)

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await updateAdminNotificationSettings({
        notification_frequency: frequency,
        email_notification_enabled: emailEnabled,
        notify_new_verification: notifyVerification,
        notify_new_report: notifyReport,
        notify_new_user: notifyNewUser,
        notify_email_failure: notifyEmailFailure,
      })

      if (result.success) {
        toast({
          title: "設定を保存しました",
        })
      } else {
        toast({
          title: "エラー",
          description: result.error || "設定の保存に失敗しました",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "エラー",
        description: "設定の保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 通知頻度 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            通知頻度
          </CardTitle>
          <CardDescription>通知を受け取るタイミングを選択してください</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={frequency}
            onValueChange={(value) => setFrequency(value as NotificationFrequency)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="immediate" id="immediate" />
              <Label htmlFor="immediate" className="flex-1 cursor-pointer">
                <div className="font-medium">即時通知</div>
                <div className="text-sm text-muted-foreground">イベント発生時にすぐ通知を受け取ります</div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="three_times_daily" id="three_times" />
              <Label htmlFor="three_times" className="flex-1 cursor-pointer">
                <div className="font-medium">1日3回（9時・12時・17時）</div>
                <div className="text-sm text-muted-foreground">朝・昼・夕方にまとめて通知を受け取ります</div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily" className="flex-1 cursor-pointer">
                <div className="font-medium">日次サマリー（毎日9時）</div>
                <div className="text-sm text-muted-foreground">1日1回、朝にまとめて通知を受け取ります</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* メール通知 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            メール通知
          </CardTitle>
          <CardDescription>メールでも通知を受け取るかどうかを設定します</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
            onClick={() => setEmailEnabled(!emailEnabled)}
          >
            <Checkbox
              id="email-enabled"
              checked={emailEnabled}
              onCheckedChange={(checked) => setEmailEnabled(checked === true)}
              className="h-5 w-5"
            />
            <div className="flex-1">
              <Label htmlFor="email-enabled" className="font-medium cursor-pointer">
                メール通知を有効にする
              </Label>
              <div className="text-sm text-muted-foreground">{adminEmail} 宛に通知メールを送信します</div>
            </div>
            <span
              className={`text-sm font-medium px-2 py-1 rounded ${emailEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
            >
              {emailEnabled ? "オン" : "オフ"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 通知対象イベント */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知対象イベント
          </CardTitle>
          <CardDescription>どのイベントの通知を受け取るか選択してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
            onClick={() => setNotifyVerification(!notifyVerification)}
          >
            <Checkbox
              id="notify-verification"
              checked={notifyVerification}
              onCheckedChange={(checked) => setNotifyVerification(checked === true)}
              className="h-5 w-5"
            />
            <FileCheck className="h-5 w-5 text-blue-500 shrink-0" />
            <div className="flex-1">
              <Label htmlFor="notify-verification" className="font-medium cursor-pointer">
                新規本人確認申請
              </Label>
              <div className="text-sm text-muted-foreground">ユーザーが本人確認書類を提出した時</div>
            </div>
            <span
              className={`text-sm font-medium px-2 py-1 rounded ${notifyVerification ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
            >
              {notifyVerification ? "オン" : "オフ"}
            </span>
          </div>

          <div
            className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
            onClick={() => setNotifyReport(!notifyReport)}
          >
            <Checkbox
              id="notify-report"
              checked={notifyReport}
              onCheckedChange={(checked) => setNotifyReport(checked === true)}
              className="h-5 w-5"
            />
            <Flag className="h-5 w-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <Label htmlFor="notify-report" className="font-medium cursor-pointer">
                新規通報
              </Label>
              <div className="text-sm text-muted-foreground">ユーザーが他のユーザーを通報した時</div>
            </div>
            <span
              className={`text-sm font-medium px-2 py-1 rounded ${notifyReport ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
            >
              {notifyReport ? "オン" : "オフ"}
            </span>
          </div>

          <div
            className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
            onClick={() => setNotifyNewUser(!notifyNewUser)}
          >
            <Checkbox
              id="notify-new-user"
              checked={notifyNewUser}
              onCheckedChange={(checked) => setNotifyNewUser(checked === true)}
              className="h-5 w-5"
            />
            <UserPlus className="h-5 w-5 text-green-500 shrink-0" />
            <div className="flex-1">
              <Label htmlFor="notify-new-user" className="font-medium cursor-pointer">
                新規ユーザー登録
              </Label>
              <div className="text-sm text-muted-foreground">新しいユーザーがアカウントを作成した時</div>
            </div>
            <span
              className={`text-sm font-medium px-2 py-1 rounded ${notifyNewUser ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
            >
              {notifyNewUser ? "オン" : "オフ"}
            </span>
          </div>

          <div
            className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
            onClick={() => setNotifyEmailFailure(!notifyEmailFailure)}
          >
            <Checkbox
              id="notify-email-failure"
              checked={notifyEmailFailure}
              onCheckedChange={(checked) => setNotifyEmailFailure(checked === true)}
              className="h-5 w-5"
            />
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
            <div className="flex-1">
              <Label htmlFor="notify-email-failure" className="font-medium cursor-pointer">
                メール送信失敗
              </Label>
              <div className="text-sm text-muted-foreground">システムからのメール送信が失敗した時</div>
            </div>
            <span
              className={`text-sm font-medium px-2 py-1 rounded ${notifyEmailFailure ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
            >
              {notifyEmailFailure ? "オン" : "オフ"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          設定を保存
        </Button>
      </div>
    </div>
  )
}
