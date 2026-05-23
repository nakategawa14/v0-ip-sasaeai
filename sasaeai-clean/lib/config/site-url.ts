/**
 * Web 版のドメイン（利用規約等をブラウザで開くときに使用）
 * sasaeai-mobile/.env に EXPO_PUBLIC_SITE_URL=https://あなたのドメイン を設定してください。
 */
export function getWebAppOrigin(): string | null {
  const raw = process.env.EXPO_PUBLIC_SITE_URL?.trim()
  if (!raw) return null
  return raw.replace(/\/$/, "")
}

export function webLegalUrl(path: "/legal/terms" | "/legal/privacy" | "/legal/tokushoho" | "/legal/company" | "/help"): string | null {
  const base = getWebAppOrigin()
  if (!base) return null
  return `${base}${path}`
}
