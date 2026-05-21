export default function TokushohoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">特定商取引法に基づく表記</h1>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">販売業者</h2>
            <p className="text-gray-700">ささえ愛運営事務局</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">運営責任者</h2>
            <p className="text-gray-700">ささえ愛運営事務局</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">所在地</h2>
            <p className="text-gray-700">※お問い合わせはメールにてお願いいたします</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">お問い合わせ</h2>
            <p className="text-gray-700">
              メールアドレス:{" "}
              <a href="mailto:info1.sasaeai@gmail.com" className="text-pink-600 hover:text-pink-700 underline">
                info1.sasaeai@gmail.com
              </a>
            </p>
            <p className="text-sm text-gray-500 mt-2">※お問い合わせへの返信は、営業日2〜3日以内にさせていただきます</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">料金</h2>
            <div className="text-gray-700 space-y-2">
              <p>β版キャンペーン期間中：全機能無料</p>
              <p className="font-semibold text-gray-900">正式版移行後（予定）：</p>
              <ul className="list-disc list-inside ml-1 space-y-1">
                <li>女性会員：無料</li>
                <li>男性会員：月額料金（アプリ内課金に準ずる）</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">支払方法</h2>
            <div className="text-gray-700 space-y-2">
              <p>App Store決済 / Google Play決済</p>
              <p className="text-sm text-gray-600">
                ※決済は各プラットフォームの提供するアプリ内課金を通じて行われます。お支払い時期、方法については、Apple社またはGoogle社の規定に基づきます。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">サービス提供時期</h2>
            <p className="text-gray-700">決済完了後、即時ご利用いただけます。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">返品・キャンセルについて</h2>
            <div className="text-gray-700 space-y-2">
              <p>サービスの性質上、決済完了後の返金・返品・キャンセルはお受けできません。</p>
              <p>解約はいつでも可能で、次回更新日以降の課金が停止されます。</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">動作環境</h2>
            <div className="text-gray-700 space-y-1">
              <p>推奨ブラウザ:</p>
              <ul className="list-disc list-inside ml-4">
                <li>Google Chrome（最新版）</li>
                <li>Safari（最新版）</li>
                <li>Microsoft Edge（最新版）</li>
                <li>Firefox（最新版）</li>
              </ul>
              <p className="mt-2">対応デバイス: PC、スマートフォン、タブレット</p>
            </div>
          </section>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-pink-600 hover:text-pink-700 underline">
            トップページに戻る
          </a>
        </div>
      </div>
    </div>
  )
}
