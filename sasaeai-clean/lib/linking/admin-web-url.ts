import { resolvePublicSiteOrigin } from "@/lib/linking/public-site-url"

/**
 * 管理画面（Next.js Web アプリ）のオリジン。
 * - 本番: EXPO_PUBLIC_ADMIN_WEB_ORIGIN または EXPO_PUBLIC_SITE_URL
 * - 開発: 未設定時は http://localhost:3000（`npm run dev` の Next 側）
 */
export function resolveAdminWebOrigin(): string {
  const raw = process.env.EXPO_PUBLIC_ADMIN_WEB_ORIGIN?.trim() ?? ""
  const stripped = raw.replace(/^['"]|['"]$/g, "").replace(/\/+$/, "")
  if (stripped) {
    return /^https?:\/\//i.test(stripped) ? stripped : `http://${stripped}`
  }
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    return "http://localhost:3000"
  }
  return resolvePublicSiteOrigin()
}

/** 例: buildAdminWebPageUrl("/admin/reports", "status=pending") */
export function buildAdminWebPageUrl(adminPath: string, search?: string): string {
  const origin = resolveAdminWebOrigin()
  const rel = adminPath.startsWith("/") ? adminPath : `/${adminPath}`
  const query =
    search === undefined || search === ""
      ? ""
      : search.startsWith("?")
        ? search
        : `?${search}`
  return `${origin}${rel}${query}`
}
