import type React from "react"
import type { Metadata } from "next"
import { Noto_Sans_JP } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ServiceWorkerRegister } from "@/components/notifications/service-worker-register"
import { SuspensionCheckWrapper } from "@/components/auth/suspension-check-wrapper"
import { PWAInstallPrompt } from "@/components/pwa/install-prompt"
import "./globals.css"

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "ささえ愛 - お互いを理解し、支え合える出会いを",
  description: "障がい者、難病患者、理解ある健常者のためのマッチングサービス。安心して出会いを探せる環境を提供します。",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ささえ愛",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple--touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
     <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>

      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        <SuspensionCheckWrapper>{children}</SuspensionCheckWrapper>
        <Analytics />
        <ServiceWorkerRegister />
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
