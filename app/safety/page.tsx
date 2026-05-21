import Link from "next/link"
import { ArrowLeft, MapPin, Ban, AlertTriangle, Lock, Users, MessageCircleWarning, Heart } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-cyan-50">
      {/* ヘッダー */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>トップページへ戻る</span>
          </Link>
          <Logo className="h-10 w-auto" />
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          {/* タイトル */}
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Heart className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              安心してご利用いただくために
            </h1>
            <p className="text-gray-600 leading-relaxed">
              ささえ愛では、すべてのユーザーが安全に出会いを楽しめるよう、
              <br className="hidden sm:block" />
              以下のガイドラインをお守りください。
            </p>
          </div>

          {/* ガイドライン項目 */}
          <div className="space-y-8">
            {/* 待ち合わせ場所 */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold text-gray-900">
                    人目のある場所で待ち合わせを
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    初対面の方と会う際は、カフェや駅前など人通りの多い公共の場所を選びましょう。
                    人気のない場所や相手の自宅に行くことは避け、
                    日中の明るい時間帯に会うことをお勧めします。
                  </p>
                </div>
              </div>
            </section>

            {/* 金銭授受の禁止 */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <Ban className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold text-gray-900">
                    金銭のやり取りは禁止です
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    ささえ愛は恋愛・友人関係のマッチングサービスです。
                    金銭の貸し借り、投資の勧誘、有料サービスへの誘導などは
                    すべて禁止されています。このような行為を見かけた場合は、
                    すぐに通報してください。
                  </p>
                </div>
              </div>
            </section>

            {/* 通報機能 */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100">
                  <MessageCircleWarning className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold text-gray-900">
                    不快なユーザーは通報・ブロック
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    不快なメッセージを受け取ったり、怪しいと感じた場合は、
                    プロフィール画面から「通報」または「ブロック」ができます。
                    通報いただいた内容は運営が確認し、適切に対処いたします。
                    我慢せず、すぐにご報告ください。
                  </p>
                </div>
              </div>
            </section>

            {/* 個人情報の管理 */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold text-gray-900">
                    個人情報は慎重に
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    本名、住所、勤務先、電話番号などの個人情報は、
                    信頼関係が築けるまで教えないようにしましょう。
                    SNSアカウントの共有も、十分に相手を知ってからにすることをお勧めします。
                  </p>
                </div>
              </div>
            </section>

            {/* 信頼できる人に相談 */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-100">
                  <Users className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold text-gray-900">
                    家族や友人に相談を
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    実際に会う前に、信頼できる家族や友人に
                    「誰と」「どこで」「何時に」会うかを伝えておきましょう。
                    困ったことがあれば、一人で抱え込まず周りに相談してください。
                  </p>
                </div>
              </div>
            </section>

            {/* 注意喚起 */}
            <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="mb-2 text-xl font-semibold text-gray-900">
                    こんな行為にご注意ください
                  </h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      すぐに会いたがる、急かすような言動
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      お金の話、投資や副業の勧誘
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      外部サービス（LINE等）への誘導を急ぐ
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      プロフィールの内容と実際が大きく異なる
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      過度に個人情報を聞き出そうとする
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* 運営サポート */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              困ったことがあれば、いつでも運営にご相談ください。
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-pink-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-700"
            >
              お問い合わせ
            </Link>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t bg-gray-50 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            <Logo className="h-8 w-auto" />
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <Link href="/" className="hover:text-pink-600 transition-colors">
                トップページ
              </Link>
              <Link href="/faq" className="hover:text-pink-600 transition-colors">
                よくある質問
              </Link>
              <Link href="/terms" className="hover:text-pink-600 transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:text-pink-600 transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/contact" className="hover:text-pink-600 transition-colors">
                お問い合わせ
              </Link>
            </div>
            <p className="text-xs text-gray-500">&copy; 2025 ささえ愛. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
