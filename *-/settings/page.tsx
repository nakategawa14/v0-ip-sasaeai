import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SubscriptionManager } from "@/components/settings/subscription-manager"
import { SecretModeToggle } from "@/components/settings/secret-mode-toggle"
import { DeleteAccountButton } from "@/components/settings/delete-account-button"
import { ContactSupportButton } from "@/components/settings/contact-support-button"
import { AmazonAffiliateCard } from "@/components/settings/amazon-affiliate-card"
import { PushNotificationToggle } from "@/components/notifications/push-notification-toggle"
import { TABLES } from "@/lib/supabase/table-names"
import Link from "next/link"

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/profile/setup")
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <DashboardHeader profile={profile} />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">設定</h1>
          <p className="text-gray-600">アカウントとサブスクリプションの管理</p>
        </div>

        <div className="space-y-6">
          {/* アカウント情報 */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">アカウント情報</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">メールアドレス</span>
                <p className="font-medium text-gray-900">{profile.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">表示名</span>
                <p className="font-medium text-gray-900">{profile.display_name}</p>
              </div>
            </div>
          </Card>

          {/* プッシュ通知設定 */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">プッシュ通知</h2>
            <p className="mb-4 text-sm text-gray-600">
              プッシュ通知をオンにすると、新しいメッセージやマッチング成立時にブラウザ通知を受け取れます。
            </p>
            <PushNotificationToggle />
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">シークレットモード</h2>
            <p className="mb-4 text-sm text-gray-600">
              シークレットモードをオンにすると、検索結果に表示されなくなります。
              <br />
              既にマッチングした相手とのやり取りは継続できます。
              <br />
              <span className="font-semibold text-green-600">※無料で利用できます</span>
            </p>
            <SecretModeToggle isSecretMode={profile.is_secret_mode || false} />
          </Card>

          {/* サブスクリプション */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">サブスクリプション</h2>
            <div className="mb-4">
              <Badge variant={profile.membership_status === "premium" ? "default" : "secondary"} className="text-sm">
                {profile.membership_status === "premium" ? "有料会員" : "無料会員"}
              </Badge>
            </div>

            {profile.membership_status === "premium" && (
              <div className="mb-6 space-y-2 text-sm">
                {profile.discounted_price && (
                  <p className="text-gray-700">
                    月額料金: <span className="font-semibold">¥{profile.discounted_price}</span>
                  </p>
                )}
                {profile.coupon_code && (
                  <p className="text-gray-700">
                    適用クーポン: <span className="font-semibold">{profile.coupon_code}</span>
                  </p>
                )}
                {profile.membership_started_at && (
                  <p className="text-gray-700">
                    開始日:{" "}
                    {new Date(profile.membership_started_at).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
                {profile.membership_expires_at && (
                  <p className="text-gray-700">
                    次回更新日:{" "}
                    {new Date(profile.membership_expires_at).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            )}

            <SubscriptionManager profile={profile} />
          </Card>

          {payments && payments.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">決済履歴</h2>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">¥{payment.amount}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.payment_date).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <Badge
                      variant={
                        payment.payment_status === "completed"
                          ? "default"
                          : payment.payment_status === "cancelled"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {payment.payment_status === "completed"
                        ? "完了"
                        : payment.payment_status === "cancelled"
                          ? "キャンセル"
                          : payment.payment_status === "pending"
                            ? "処理中"
                            : "失敗"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <AmazonAffiliateCard />

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">サポート・規約</h2>
            <div className="space-y-3">
              <ContactSupportButton />
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/terms" className="text-sm text-blue-600 underline-offset-4 hover:underline">
                  利用規約
                </Link>
                <Link href="/privacy" className="text-sm text-blue-600 underline-offset-4 hover:underline">
                  プライバシーポリシー
                </Link>
                <Link href="/legal" className="text-sm text-blue-600 underline-offset-4 hover:underline">
                  特定商取引法に基づく表記
                </Link>
              </div>
            </div>
          </Card>

          <Card className="border-red-200 p-6">
            <h2 className="mb-4 text-xl font-semibold text-red-600">退会</h2>
            <div className="mb-4 space-y-2 text-sm text-gray-700">
              <p className="font-semibold">退会すると以下のデータが削除されます：</p>
              <ul className="list-inside list-disc space-y-1 pl-2">
                <li>プロフィール情報</li>
                <li>マッチング履歴</li>
                <li>メッセージ履歴</li>
                <li>いいね履歴</li>
              </ul>
              <p className="mt-4 font-semibold text-red-600">※一度削除したデータは復元できません。</p>
              {profile.membership_status === "premium" && (
                <p className="mt-2 font-semibold text-red-600">
                  ※有料会員の場合、退会後も課金は継続されます。
                  <br />
                  課金を停止するには、決済ページでサブスクリプションをキャンセルしてください。
                </p>
              )}
            </div>
            <DeleteAccountButton />
          </Card>
        </div>
      </main>
    </div>
  )
}
