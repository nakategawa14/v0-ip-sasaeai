import { LegalSections, LegalStaticPage } from "@/components/legal/legal-static-page"
import { TERMS_SECTIONS } from "@/lib/legal/terms-sections"

export default function TermsPage() {
  return (
    <LegalStaticPage title="利用規約" updatedLabel="最終更新日：2026年4月11日">
      <p className="mb-6 text-sm text-gray-600">
        本規約は雛形です。実運用前に内容をご確認のうえ、必要に応じて専門家の助言を受けてください。
      </p>
      <LegalSections sections={TERMS_SECTIONS} />
    </LegalStaticPage>
  )
}
