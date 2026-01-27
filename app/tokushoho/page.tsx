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
            <h2 className="text-xl font-semibold text-gray-900 mb-3">販売価格</h2>
            <div className="text-gray-700">
              <p>有料プラン: 980円（税込）/ 月</p>
              <p className="text-sm text-gray-500 mt-1">※クーポン利用時: 480円（税込）/ 月</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">クーポンについて</h2>
            <div className="text-gray-700 space-y-2">
              <p>クーポンコードは、有料プラン申込時または既存会員がマイページから適用できます。</p>
              <div className="ml-4 space-y-1">
                <p className="font-semibold">適用タイミング:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>新規申込時: 初回決済から適用されます</li>
                  <li>既存会員: 次回請求日（更新日）から適用されます</li>
                </ul>
              </div>
              <div className="ml-4 space-y-1">
                <p className="font-semibold">注意事項:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>既存会員がクーポンを適用した場合、当月分の返金や日割り調整は行いません</li>
                  <li>クーポン適用後の取り消しや変更はできません</li>
                  <li>一度適用したクーポンは継続して適用されます</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                例: 12月15日に980円で有料プラン開始、12月20日にクーポン適用 →
                1月15日の更新から480円に変更（12月分の差額500円は返金されません）
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">支払方法</h2>
            <p className="text-gray-700">クレジットカード決済（Square）</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">支払時期</h2>
            <p className="text-gray-700">有料プラン申し込み時に即時決済されます。以降、毎月自動更新となります。</p>
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
              <p className="text-sm text-gray-500">※クーポン適用後の差額返金もお受けできませんのでご了承ください。</p>
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
