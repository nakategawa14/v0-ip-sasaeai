const DEFAULT_SITE = "https://sasaeai.help"

/** 末尾スラッシュなしのオリジン（https:// 付き） */
export function resolvePublicSiteOrigin(): string {
  const rawEnv = process.env.EXPO_PUBLIC_SITE_URL?.trim() ?? ""
  const stripped = rawEnv.replace(/^['"]|['"]$/g, "").replace(/\/+$/, "")
  const base = stripped || DEFAULT_SITE
  const withScheme = /^https?:\/\//i.test(base) ? base : `https://${base.replace(/^\/+/, "")}`
  try {
    const u = new URL(withScheme.endsWith("/") ? withScheme : `${withScheme}/`)
    if (u.protocol !== "http:" && u.protocol !== "https:") return DEFAULT_SITE
    return `${u.protocol}//${u.host}`
  } catch {
    return DEFAULT_SITE
  }
}

/** サイト直下のパス（先頭 /）から完全な http(s) URL を生成 */
export function buildPublicSitePageUrl(path: string): string {
  const origin = resolvePublicSiteOrigin()
  const rel = path.startsWith("/") ? path : `/${path}`
  try {
    return new URL(rel, `${origin}/`).href
  } catch {
    return `${origin}${rel}`
  }
}
