"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface VerificationCardProps {
  user: {
    id: string
    nickname: string
    email: string
    birth_date: string | null
    id_verification_image_url: string | null
    selfie_verification_image_url: string | null
  }
}

function convertToJapaneseEra(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  let era = ""
  let eraYear = 0

  if (year >= 2019 && (year > 2019 || month >= 5)) {
    // 令和: 2019年5月1日〜
    era = "令和"
    eraYear = year - 2018
  } else if (year >= 1989 && (year > 1989 || month >= 1 || day >= 8)) {
    // 平成: 1989年1月8日〜2019年4月30日
    era = "平成"
    eraYear = year - 1988
  } else if (year >= 1926 && (year > 1926 || month >= 12 || day >= 25)) {
    // 昭和: 1926年12月25日〜1989年1月7日
    era = "昭和"
    eraYear = year - 1925
  } else if (year >= 1912 && (year > 1912 || month >= 7 || day >= 30)) {
    // 大正: 1912年7月30日〜1926年12月24日
    era = "大正"
    eraYear = year - 1911
  } else {
    // 明治以前
    era = "明治"
    eraYear = year - 1867
  }

  return `${era}${eraYear}年`
}

export default function VerificationCard({ user }: VerificationCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sendingLicense, setSendingLicense] = useState(false)
  const [sendingSelfie, setSendingSelfie] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState<string>("")
  const [customRejectReason, setCustomRejectReason] = useState<string>("")

  const handleApprove = async () => {
    if (!confirm("この本人確認を承認しますか?")) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/verification/${user.id}/approve`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        alert("本人確認を承認しました。ユーザーに通知メールを送信しました。")
        router.refresh()
      } else {
        alert(`承認に失敗しました: ${data.error || "不明なエラー"}`)
      }
    } catch (error) {
      console.error("Approve error:", error)
      alert("承認に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setRejectDialogOpen(true)
  }

  const handleRejectWithReason = async () => {
    const finalReason = rejectReason === "custom" ? customRejectReason : rejectReason

    if (!finalReason || finalReason.trim() === "") {
      alert("却下理由を選択または入力してください")
      return
    }

    setRejectDialogOpen(false)
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/verification/${user.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: finalReason,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("本人確認を却下しました。ユーザーに再提出依頼メールを送信しました。")
        setRejectReason("")
        setCustomRejectReason("")
        router.push("/admin/verification")
      } else {
        alert(`却下に失敗しました: ${data.error || "不明なエラー"}`)
      }
    } catch (error) {
      console.error("Reject error:", error)
      alert("却下に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleSendLicenseReminder = async () => {
    if (!confirm(`${user.nickname}さんに免許証登録催促メールを送信しますか？`)) return

    setSendingLicense(true)

    try {
      const response = await fetch(`/api/admin/send-individual-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          emailType: "license_reminder",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("免許証登録催促メールを送信しました")
      } else {
        alert(`送信に失敗しました: ${data.error || "不明なエラー"}`)
      }
    } catch (error) {
      console.error("Send license reminder error:", error)
      alert("送信に失敗しました")
    } finally {
      setSendingLicense(false)
    }
  }

  const handleSendSelfieReminder = async () => {
    if (!confirm(`${user.nickname}さんに自撮り登録催促メールを送信しますか？`)) return

    setSendingSelfie(true)

    try {
      const response = await fetch(`/api/admin/send-individual-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          emailType: "selfie_reminder",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("自撮り登録催促メールを送信しました")
      } else {
        alert(`送信に失敗しました: ${data.error || "不明なエラー"}`)
      }
    } catch (error) {
      console.error("Send selfie reminder error:", error)
      alert("送信に失敗しました")
    } finally {
      setSendingSelfie(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">{user.nickname}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="mt-2 text-base font-medium text-gray-800">
              生年月日:{" "}
              {user.birth_date ? (
                <>
                  {new Date(user.birth_date).toLocaleDateString("ja-JP")}
                  <span className="ml-2 text-sm text-gray-600">({convertToJapaneseEra(user.birth_date)})</span>
                </>
              ) : (
                "未設定"
              )}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">本人確認書類</h4>
              {user.id_verification_image_url ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="relative h-64 w-full cursor-pointer overflow-hidden rounded-lg border hover:opacity-90">
                      <Image
                        src={user.id_verification_image_url || "/placeholder.svg"}
                        alt="本人確認書類"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <div className="relative h-[80vh] w-full">
                      <Image
                        src={user.id_verification_image_url || "/placeholder.svg"}
                        alt="本人確認書類（拡大）"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">未提出</p>
                  <Button
                    onClick={handleSendLicenseReminder}
                    disabled={sendingLicense}
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                  >
                    {sendingLicense ? "送信中..." : "免許証登録を催促"}
                  </Button>
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 font-medium">自撮り画像</h4>
              {user.selfie_verification_image_url ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="relative h-64 w-full cursor-pointer overflow-hidden rounded-lg border hover:opacity-90">
                      <Image
                        src={user.selfie_verification_image_url || "/placeholder.svg"}
                        alt="自撮り確認画像"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <div className="relative h-[80vh] w-full">
                      <Image
                        src={user.selfie_verification_image_url || "/placeholder.svg"}
                        alt="自撮り確認画像（拡大）"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">未提出</p>
                  <Button
                    onClick={handleSendSelfieReminder}
                    disabled={sendingSelfie}
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                  >
                    {sendingSelfie ? "送信中..." : "自撮り登録を催促"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:w-48">
          <Button onClick={handleApprove} disabled={loading} className="w-full" variant="default">
            {loading ? "処理中..." : "承認する"}
          </Button>
          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={loading} className="w-full" variant="destructive">
                {loading ? "処理中..." : "却下する"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>本人確認を却下</DialogTitle>
                <DialogDescription>
                  却下理由を選択または入力してください。この理由はユーザーにメールで通知されます。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <RadioGroup value={rejectReason} onValueChange={setRejectReason}>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="生年月日が不鮮明で確認できない" id="reason1" />
                    <Label htmlFor="reason1" className="cursor-pointer font-normal">
                      生年月日が不鮮明で確認できない
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="顔写真が不鮮明で本人確認ができない" id="reason2" />
                    <Label htmlFor="reason2" className="cursor-pointer font-normal">
                      顔写真が不鮮明で本人確認ができない
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="書類の一部が切れている、または範囲外になっている" id="reason3" />
                    <Label htmlFor="reason3" className="cursor-pointer font-normal">
                      書類の一部が切れている、または範囲外になっている
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="自撮り画像と本人確認書類の顔写真が一致しない" id="reason4" />
                    <Label htmlFor="reason4" className="cursor-pointer font-normal">
                      自撮り画像と本人確認書類の顔写真が一致しない
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="提出された書類が有効期限切れ" id="reason5" />
                    <Label htmlFor="reason5" className="cursor-pointer font-normal">
                      提出された書類が有効期限切れ
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="cursor-pointer font-normal">
                      その他（自由入力）
                    </Label>
                  </div>
                </RadioGroup>

                {rejectReason === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="customReason">却下理由を入力してください</Label>
                    <Textarea
                      id="customReason"
                      placeholder="具体的な却下理由を入力してください..."
                      value={customRejectReason}
                      onChange={(e) => setCustomRejectReason(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setRejectDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="button" variant="destructive" onClick={handleRejectWithReason}>
                  却下する
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Link href={`/admin/users/${user.id}`}>
            <Button className="w-full bg-transparent" variant="outline">
              詳細を見る
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
