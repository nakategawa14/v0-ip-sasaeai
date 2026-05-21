import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"

export default async function PrivacyPage() {
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
          <h1 className="mb-6 text-3xl font-bold text-gray-900">プライバシーポリシー</h1>

          <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">個人情報の収集</h2>
              <p>本サービスでは、以下の個人情報を収集します：</p>
              <ul className="list-inside list-disc space-y-1">
                <li>メールアドレス</li>
                <li>ニックネーム、表示名</li>
                <li>プロフィール情報（年齢、性別、居住地など）</li>
                <li>プロフィール画像</li>
                <li>利用履歴</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">個人情報の利用目的</h2>
              <p>収集した個人情報は、以下の目的で利用します：</p>
              <ul className="list-inside list-disc space-y-1">
                <li>本サービスの提供・運営</li>
                <li>利用者のマッチング</li>
                <li>利用者からの問い合わせ対応</li>
                <li>サービスの改善・新機能の開発</li>
                <li>規約違反行為への対応</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">個人情報の第三者提供</h2>
              <p>法令に基づく場合を除き、利用者の同意なく個人情報を第三者に提供することはありません。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">個人情報の安全管理</h2>
              <p>個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のため、 適切な措置を講じます。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">個人情報の開示・訂正・削除</h2>
              <p>
                利用者は、自己の個人情報の開示、訂正、削除を請求することができます。
                退会時には、すべての個人情報が削除されます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">Cookie等の利用</h2>
              <p>
                本サービスでは、利便性向上のためCookieを使用します。
                利用者はブラウザの設定でCookieを無効にすることができますが、 一部機能が利用できなくなる場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">お問い合わせ</h2>
              <p>個人情報の取扱いに関するお問い合わせは、設定ページの「運営にメッセージを送る」からご連絡ください。</p>
            </section>

            <div className="mt-8 text-right text-sm text-gray-600">
              <p>制定日：2025年1月1日</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
