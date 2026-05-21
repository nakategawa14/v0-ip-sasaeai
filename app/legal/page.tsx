import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"

export default async function LegalPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from(TABLES.PROFILES).select("*").eq("id", user.id).single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {profile && <DashboardHeader profile={profile} />}

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Card className="p-8">
          <h1 className="mb-6 text-3xl font-bold text-gray-900">特定商取引法に基づく表記</h1>

          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900">サービス名称</h3>
              <p>ささえ愛マッチングサービス</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">運営者</h3>
              <p>（運営者名を記載）</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">所在地</h3>
              <p>（所在地を記載）</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">連絡先</h3>
              <p>設定ページの「運営にメッセージを送る」からお問い合わせください</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">サービス内容</h3>
              <p>障がいのある方とサポーターのマッチングサービス</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">料金</h3>
              <div className="space-y-2">
                <p>β版キャンペーン期間中：全機能無料</p>
                <p className="font-medium text-gray-900">正式版移行後（予定）：</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>女性会員：無料</li>
                  <li>男性会員：月額料金（アプリ内課金に準ずる）</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">支払方法</h3>
              <div className="space-y-2">
                <p>App Store決済 / Google Play決済</p>
                <p className="text-sm text-gray-600">
                  ※決済は各プラットフォームの提供するアプリ内課金を通じて行われます。お支払い時期、方法については、Apple社またはGoogle社の規定に基づきます。
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">サービス提供時期</h3>
              <p>決済完了後、即時利用可能</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">解約について</h3>
              <p>
                いつでも解約可能です。解約手続きは設定ページから行えます。
                解約後は次回更新日まで有料会員機能が利用できます。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">返金について</h3>
              <p>
                月額制サービスのため、原則として返金は行いません。
                ただし、サービスに重大な不具合があった場合は、個別に対応いたします。
              </p>
            </div>

            <div className="mt-8 text-right text-sm text-gray-600">
              <p>制定日：2025年1月1日</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
