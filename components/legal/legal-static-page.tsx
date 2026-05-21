import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export function LegalStaticPage({
  title,
  updatedLabel,
  children,
}: {
  title: string
  updatedLabel?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <div className="border-b bg-white/90 backdrop-blur-sm">
        <div className="container mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-pink-600 hover:text-pink-700">
            <ArrowLeft className="h-4 w-4" />
            トップへ
          </Link>
        </div>
      </div>
      <article className="container mx-auto max-w-3xl px-4 py-10 pb-16">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{title}</h1>
        {updatedLabel ? <p className="mb-8 text-sm text-gray-500">{updatedLabel}</p> : <div className="mb-8" />}
        <div className="prose prose-gray max-w-none text-gray-800 prose-p:leading-relaxed prose-headings:text-gray-900">
          {children}
        </div>
      </article>
    </div>
  )
}

export function LegalSections({
  sections,
}: {
  sections: { title: string; paragraphs: string[] }[]
}) {
  return (
    <div className="space-y-8">
      {sections.map((s) => (
        <section key={s.title}>
          <h2 className="mb-3 text-lg font-semibold">{s.title}</h2>
          <div className="space-y-3">
            {s.paragraphs.map((p, i) => (
              <p key={i} className="text-[15px] leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
