import Link from "next/link"
import { LegalStaticPage } from "@/components/legal/legal-static-page"
import { OPERATOR_INFO, SUPPORT_MAILTO } from "@/lib/legal/operator-info"

export default function CompanyInfoPage() {
  return (
    <LegalStaticPage title="運営情報" updatedLabel="特定商取引法に基づく表記等で使用する情報です。">
      <dl className="space-y-4 text-[15px] leading-relaxed">
        <div>
          <dt className="font-semibold text-gray-900">運営</dt>
          <dd className="mt-1 text-gray-700">{OPERATOR_INFO.name}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-900">責任者</dt>
          <dd className="mt-1 text-gray-700">{OPERATOR_INFO.representative}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-900">住所</dt>
          <dd className="mt-1 text-gray-700">{OPERATOR_INFO.address}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-900">連絡先</dt>
          <dd className="mt-1">
            <a href={SUPPORT_MAILTO} className="text-pink-600 underline hover:text-pink-700">
              {OPERATOR_INFO.email}
            </a>
          </dd>
        </div>
      </dl>
      <p className="mt-10 text-sm text-gray-600">
        <Link href="/legal/tokushoho" className="font-medium text-pink-600 hover:text-pink-700">
          特定商取引法に基づく表記
        </Link>
        もあわせてご確認ください。
      </p>
    </LegalStaticPage>
  )
}
