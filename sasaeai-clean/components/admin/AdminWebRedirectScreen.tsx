import { useEffect, useMemo } from "react"
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams } from "expo-router"

import { buildAdminWebPageUrl } from "@/lib/linking/admin-web-url"
import { openLegalPublicHttpsInSystemBrowser } from "@/lib/linking/legalPublicDocuments"

type Props = {
  /** `/admin` 以降のパス（例: `/admin/reports`） */
  adminPath: string
}

function buildQueryFromParams(params: Record<string, string | string[] | undefined>, exclude: string[]): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (exclude.includes(key) || value === undefined) continue
    if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, v))
    } else {
      sp.set(key, value)
    }
  }
  const q = sp.toString()
  return q ? `?${q}` : ""
}

/**
 * Expo アプリ内の `/admin/*` や `/home/admin/*` から、
 * Next.js 管理画面（別オリジン）へ誘導する。
 */
export function AdminWebRedirectScreen({ adminPath }: Props) {
  const params = useLocalSearchParams<Record<string, string | string[] | undefined>>()

  const targetUrl = useMemo(() => {
    const query = buildQueryFromParams(params, ["path"])
    const search = query.startsWith("?") ? query.slice(1) : query
    return buildAdminWebPageUrl(adminPath, search || undefined)
  }, [adminPath, params])

  useEffect(() => {
    if (Platform.OS === "web") {
      window.location.replace(targetUrl)
      return
    }
    void openLegalPublicHttpsInSystemBrowser(targetUrl)
  }, [targetUrl])

  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color="#db2777" />
      <Text style={styles.title}>管理画面へ移動しています</Text>
      <Text style={styles.hint}>
        自動で開かない場合は、Web 版の管理画面（Next.js）を起動し、次の URL を開いてください。
      </Text>
      <Text style={styles.url} selectable>
        {targetUrl}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fdf2f8",
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  hint: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  url: {
    fontSize: 12,
    color: "#db2777",
    textAlign: "center",
  },
})
