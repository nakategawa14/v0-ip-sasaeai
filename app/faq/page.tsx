"use client"

import Link from "next/link"
import { ArrowLeft, HelpCircle, ChevronDown } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: "料金はかかりますか？",
    answer:
      "現在β版キャンペーン期間中のため、すべての機能を無料でご利用いただけます。正式版移行後は、女性会員は引き続き無料、男性会員のみ月額料金（アプリ内課金）がかかる予定です。",
  },
  {
    question: "障がい者手帳がなくても利用できますか？",
    answer:
      "はい、ご利用いただけます。ささえ愛は障がい者手帳の有無に関わらず、障がいや難病をお持ちの方、またそのような方々を理解しサポートしたいと思う方々のためのサービスです。手帳の提示は必須ではありません。",
  },
  {
    question: "本人確認はありますか？",
    answer:
      "はい、安全なサービス運営のため本人確認をお願いしています。運転免許証またはマイナンバーカードの顔写真と生年月日部分のみをアップロードいただきます。住所や免許番号などの個人情報は取得しませんのでご安心ください。",
  },
  {
    question: "シークレットモードとは何ですか？",
    answer:
      "シークレットモードを有効にすると、あなたのプロフィールが他のユーザーの検索結果に表示されなくなります。自分から「いいね」を送った相手にのみプロフィールが公開されるため、知り合いに見つかりたくない方におすすめの機能です。",
  },
  {
    question: "マッチングした相手とどうやって連絡を取りますか？",
    answer:
      "お互いに「いいね」を送り合うとマッチングが成立し、アプリ内のメッセージ機能でやり取りができるようになります。まずはアプリ内で十分にコミュニケーションを取ってから、実際にお会いすることをお勧めします。",
  },
  {
    question: "退会したい場合はどうすればいいですか？",
    answer:
      "アプリ内の「設定」メニューから退会手続きを行えます。退会すると、プロフィール情報やマッチング履歴などすべてのデータが削除されます。再登録する場合は、最初からやり直しになりますのでご注意ください。",
  },
  {
    question: "不快なユーザーがいた場合はどうすればいいですか？",
    answer:
      "相手のプロフィール画面から「通報」または「ブロック」ができます。通報いただいた内容は運営が確認し、利用規約に違反している場合は適切な対処を行います。安心してご報告ください。",
  },
  {
    question: "サポーターとして登録できますか？",
    answer:
      "はい、もちろんです。ささえ愛は障がいのある方だけでなく、理解あるサポーターの方にもご登録いただいています。登録時に「サポーター」を選択してください。障がいや難病への理解がある方、支え合いたいと思う方を歓迎します。",
  },
]

function FAQAccordion({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-pink-600"
      >
        <span className="pr-4 text-lg font-medium text-gray-900">{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-gray-600 leading-relaxed">{item.answer}</p>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const handleClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
              <HelpCircle className="h-8 w-8 text-pink-600" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              よくある質問
            </h1>
            <p className="text-gray-600 leading-relaxed">
              ささえ愛についてよくいただくご質問にお答えします
            </p>
          </div>

          {/* FAQ アコーディオン */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            {faqItems.map((item, index) => (
              <FAQAccordion
                key={index}
                item={item}
                isOpen={openIndex === index}
                onClick={() => handleClick(index)}
              />
            ))}
          </div>

          {/* その他のお問い合わせ */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              お探しの回答が見つからない場合は、お気軽にお問い合わせください。
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
              <Link href="/safety" className="hover:text-pink-600 transition-colors">
                安全ガイドライン
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
