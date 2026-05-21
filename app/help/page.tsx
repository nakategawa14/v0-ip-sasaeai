import Link from "next/link"
import { LegalStaticPage } from "@/components/legal/legal-static-page"
import { FAQ_SECTIONS } from "@/lib/legal/faq-sections"

export default function HelpPage() {
  return (
    <LegalStaticPage title="よくある質問 / 使い方 / 安全について">
      <div className="space-y-10">
        {FAQ_SECTIONS.map((block) => (
          <section key={block.title}>
            <h2 className="mb-4 border-b border-pink-100 pb-2 text-xl font-bold text-gray-900">{block.title}</h2>
            <ul className="space-y-6">
              {block.items.map((item) => (
                <li key={item.q}>
                  <p className="font-semibold text-gray-900">Q. {item.q}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-gray-700">A. {item.a}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-12 text-center text-sm text-gray-600">
        その他のお問い合わせは{" "}
        <Link href="/legal/company" className="font-medium text-pink-600 hover:text-pink-700">
          運営情報・連絡先
        </Link>
        をご確認ください。
      </p>
    </LegalStaticPage>
  )
}
