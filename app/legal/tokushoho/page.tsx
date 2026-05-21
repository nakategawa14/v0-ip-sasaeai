import Link from "next/link"
import { LegalStaticPage } from "@/components/legal/legal-static-page"
import { OPERATOR_INFO, SUPPORT_MAILTO } from "@/lib/legal/operator-info"

export default function TokushohoPage() {
  return (
    <LegalStaticPage title="特定商取引法に基づく表記" updatedLabel="電子商取引に関する表記（雛形・参考用）">
      <div className="space-y-6 text-[15px] leading-relaxed">
        <section>
          <h2 className="mb-2 text-lg font-semibold">販売事業者名</h2>
          <p>{OPERATOR_INFO.name}</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">運営責任者</h2>
          <p>{OPERATOR_INFO.representative}</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">所在地</h2>
          <p>{OPERATOR_INFO.address}</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">お問い合わせ先</h2>
          <p>
            メール：{" "}
            <a href={SUPPORT_MAILTO} className="text-pink-600 underline hover:text-pink-700">
              {OPERATOR_INFO.email}
            </a>
          </p>
          <p className="mt-2 text-sm text-gray-600">
            電話番号の公表が必要な場合は、本ページに追記してください。
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">料金</h2>
          <div className="space-y-2">
            <p>β版キャンペーン期間中：全機能無料</p>
            <p className="font-semibold text-gray-900">正式版移行後（予定）：</p>
            <ul className="list-inside list-disc space-y-1">
              <li>女性会員：無料</li>
              <li>男性会員：月額料金（アプリ内課金に準ずる）</li>
            </ul>
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">支払方法</h2>
          <div className="space-y-2">
            <p>App Store決済 / Google Play決済</p>
            <p className="text-sm text-gray-600">
              ※決済は各プラットフォームの提供するアプリ内課金を通じて行われます。お支払い時期、方法については、Apple社またはGoogle社の規定に基づきます。
            </p>
          </div>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">サービス提供時期</h2>
          <p>決済完了後、または無料機能については登録完了後、直ちに利用可能となります（メンテナンス等の停止時を除きます）。</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">返品・キャンセル</h2>
          <p>
            デジタルコンテンツの性質上、原則として契約成立後の返品・キャンセルはお受けできません。法令により認められる場合はこの限りではありません。サブスクリプションの解約条件は利用規約および決済画面の案内に従います。
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold">動作環境</h2>
          <p>推奨ブラウザ：各OSの最新版 Chrome / Safari / Edge 等。モバイルアプリを提供する場合はストアの説明に記載の対応OSとします。</p>
        </section>
      </div>
      <p className="mt-10 text-sm text-gray-600">
        <Link href="/legal/company" className="font-medium text-pink-600 hover:text-pink-700">
          運営情報のみを見る
        </Link>
      </p>
    </LegalStaticPage>
  )
}
