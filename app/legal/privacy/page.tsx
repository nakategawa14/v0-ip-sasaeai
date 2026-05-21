import { LegalSections, LegalStaticPage } from "@/components/legal/legal-static-page"
import { PRIVACY_SECTIONS } from "@/lib/legal/privacy-sections"

export default function PrivacyPage() {
  return (
    <LegalStaticPage title="プライバシーポリシー" updatedLabel="最終更新日：2026年4月11日">
      <p className="mb-6 text-sm text-gray-600">
        本ポリシーは雛形です。取得するデータ項目や第三者提供の有無に応じて改訂してください。
      </p>
      <LegalSections sections={PRIVACY_SECTIONS} />
    </LegalStaticPage>
  )
}
