import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, Shield, Users, BookOpen } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { HeroImageWithTags } from "@/components/landing/hero-image-with-tags"
import { ComingSoon } from "@/components/maintenance/coming-soon"
import { MAINTENANCE_MODE } from "@/lib/config/maintenance"

export default function LandingPage() {
  if (MAINTENANCE_MODE) {
    return <ComingSoon />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-yellow-50">
      {/* ヘッダー */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Logo className="h-12 w-auto" />
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">ログイン</Button>
            </Link>
            <Link href="/signup">
              <Button>新規登録</Button>
            </Link>
          </div>
        </nav>
      </header>

      <section className="container mx-auto px-4 py-4">
        <a
          href="https://compass.graffer.jp/handbook/landing"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="overflow-hidden border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6 transition-all hover:border-blue-300 hover:shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <BookOpen className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">お悩みハンドブック</h3>
                  <p className="text-sm text-gray-600">障がい者の方の生活に役立つ情報をご提供しています</p>
                </div>
              </div>
              <Button variant="outline" className="hidden shrink-0 sm:flex bg-transparent">
                詳しく見る
              </Button>
            </div>
          </Card>
        </a>
      </section>

      {/* ヒーローセクション */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-balance text-5xl font-bold text-gray-900">
            お互いを理解し、
            <br />
            支え合える出会いを
          </h2>
          <p className="mb-8 text-pretty text-xl text-gray-600 leading-relaxed">
            障がい者、病気の方（指定難病に限らず）、そして理解ある健常者のための
            <br />
            新しいマッチングサービス
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                無料で始める
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                詳しく見る
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <HeroImageWithTags />
      </section>

      {/* 特徴セクション */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h3 className="mb-12 text-center text-3xl font-bold text-gray-900">ささえ愛の特徴</h3>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
            <h4 className="mb-2 text-xl font-semibold text-gray-900">理解し合える出会い</h4>
            <p className="text-gray-600 leading-relaxed">
              障がいや難病への理解を持つ方々との、安心できる出会いをサポートします
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="mb-2 text-xl font-semibold text-gray-900">安心・安全な環境</h4>
            <p className="text-gray-600 leading-relaxed">
              プライバシーを守り、安心してご利用いただける環境を提供します
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="mb-2 text-xl font-semibold text-gray-900">多様な出会い</h4>
            <p className="text-gray-600 leading-relaxed">
              様々なバックグラウンドを持つ方々との、新しい出会いが待っています
            </p>
          </Card>
        </div>
      </section>

      {/* 料金プラン */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="mb-4 text-center text-3xl font-bold text-gray-900">リーズナブルな料金プラン</h3>
        <p className="mb-8 text-center text-lg text-gray-600">女性はすべての機能が無料でつかえます</p>
        <p className="mb-12 text-center text-base text-gray-600">男性は月額980円でメッセージ送信が可能になります</p>
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <Card className="p-8">
            <h4 className="mb-4 text-2xl font-bold text-gray-900">無料会員</h4>
            <p className="mb-6 text-4xl font-bold text-gray-900">
              ¥0<span className="text-lg font-normal text-gray-600">/月</span>
            </p>
            <ul className="mb-8 space-y-3 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                プロフィール作成・閲覧
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                いいね送信
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                メッセージ送信（女性のみ）
              </li>
            </ul>
          </Card>

          <Card className="relative overflow-hidden border-2 border-pink-500 p-8">
            <div className="absolute right-0 top-0 bg-pink-500 px-3 py-1 text-sm text-white">おすすめ</div>
            <h4 className="mb-4 text-2xl font-bold text-gray-900">有料会員（男性のみ）</h4>
            <div className="mb-6">
              <p className="text-4xl font-bold text-gray-900">
                ¥980<span className="text-lg font-normal text-gray-600">/月</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-pink-600">業界最安値に挑戦！</p>
            </div>
            <ul className="mb-8 space-y-3 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                すべての無料機能
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                メッセージ送信
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                マッチング無制限
              </li>
            </ul>
          </Card>
        </div>
        <p className="mt-8 text-center text-sm text-gray-600">
          ※ 格安でのサービス提供のため、有料会員の方にも広告閲覧にご協力をお願いしております
        </p>
      </section>

      {/* 注意喚起セクション */}
      <section className="container mx-auto px-4 py-20">
        <Card className="mx-auto max-w-4xl border-2 border-red-200 bg-red-50 p-8">
          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600" />
            <h3 className="text-2xl font-bold text-red-900">安全にご利用いただくために</h3>
          </div>
          <div className="space-y-4 text-gray-800">
            <div className="rounded-lg bg-white p-4">
              <h4 className="mb-2 font-semibold text-red-900">ロマンス詐欺にご注意ください</h4>
              <p className="text-sm leading-relaxed">
                恋愛感情を利用してお金をだまし取る「ロマンス詐欺」が増えています。知り合って間もない相手から金銭の要求があった場合は、すぐに運営にご報告ください。
              </p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <h4 className="mb-2 font-semibold text-red-900">お金の貸し借りは絶対にしないでください</h4>
              <p className="text-sm leading-relaxed">
                マッチング相手とのお金の貸し借りは、トラブルの原因となります。どのような理由であっても、お金の貸し借りは固くお断りします。
              </p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <h4 className="mb-2 font-semibold text-red-900">性被害にあわないために</h4>
              <p className="text-sm leading-relaxed">
                初めて会う際は、必ず人目のある場所を選び、友人や家族に会う場所と時間を伝えましょう。不安を感じたら、すぐにその場を離れてください。
              </p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <h4 className="mb-2 font-semibold text-red-900">個人情報の取り扱いにご注意</h4>
              <p className="text-sm leading-relaxed">
                住所、勤務先、銀行口座などの個人情報は、信頼関係が十分に築けるまで相手に伝えないようにしましょう。
              </p>
            </div>
            <div className="mt-6 rounded-lg bg-yellow-100 p-4">
              <p className="text-sm font-semibold text-gray-900">
                不審な行為を発見した場合は、すぐに運営（
                <Link href="/contact" className="text-blue-600 underline">
                  お問い合わせ
                </Link>
                ）にご報告ください。
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 p-12 text-white">
          <h3 className="mb-4 text-3xl font-bold">今すぐ始めましょう</h3>
          <p className="mb-8 text-lg opacity-90">無料会員登録で、新しい出会いを探すことができます</p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="bg-white text-pink-600 hover:bg-gray-100">
              無料で新規登録
            </Button>
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Logo className="mb-4 h-8 w-auto" />
              <p className="text-sm text-gray-600">お互いを理解し、支え合える出会いを</p>
            </div>
            <div>
              <h5 className="mb-4 font-semibold text-gray-900">サービス</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/about">ささえ愛について</Link>
                </li>
                <li>
                  <Link href="/how-it-works">使い方</Link>
                </li>
                <li>
                  <Link href="/safety">安全への取り組み</Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="mb-4 font-semibold text-gray-900">サポート</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/faq">よくある質問</Link>
                </li>
                <li>
                  <Link href="/contact">お問い合わせ</Link>
                </li>
                <li>
                  <Link href="/help">ヘルプセンター</Link>
                </li>
                <li>
                  <a
                    href="https://compass.graffer.jp/handbook/landing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    お悩みハンドブック
                    <BookOpen className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="mb-4 font-semibold text-gray-900">法的情報</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/terms">利用規約</Link>
                </li>
                <li>
                  <Link href="/privacy">プライバシーポリシー</Link>
                </li>
                <li>
                  <Link href="/tokushoho">特定商取引法</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2025 ささえ愛. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
