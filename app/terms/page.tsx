import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { TABLES } from "@/lib/supabase/table-names"

export default async function TermsPage() {
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
          <h1 className="mb-6 text-3xl font-bold text-gray-900">利用規約</h1>

          <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900">第1条（適用）</h2>
              <p>
                本規約は、「ささえ愛」（以下「本サービス」）の利用条件を定めるものです。
                利用者は、本規約に同意した上で本サービスを利用するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">第2条（利用登録）</h2>
              <p>
                利用者は、本サービスの利用に際し、正確な情報を登録するものとします。
                虚偽の情報を登録した場合、アカウントを停止することがあります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">第3条（禁止事項）</h2>
              <p>利用者は、以下の行為を行ってはなりません：</p>
              <ul className="list-inside list-disc space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>他の利用者または第三者の権利を侵害する行為</li>
                <li>虚偽の情報を掲載する行為</li>
                <li>営利目的での利用</li>
                <li>本サービスの運営を妨害する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">第4条（有料サービス）</h2>
              <p>
                本サービスには無料プランと有料プランがあります。
                有料プランの料金、支払方法、解約については、別途定める通りとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">第5条（退会）</h2>
              <p>
                利用者は、いつでも退会することができます。
                退会後、登録情報およびすべてのデータは削除され、復元することはできません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">第6条（免責事項）</h2>
              <p>
                本サービスは、利用者間のマッチングを提供するものであり、 出会いや交際を保証するものではありません。
                利用者間のトラブルについて、運営者は一切の責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900">第7条（規約の変更）</h2>
              <p>
                運営者は、必要に応じて本規約を変更することができます。
                変更後の規約は、本サイト上に掲載した時点で効力を生じるものとします。
              </p>
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
