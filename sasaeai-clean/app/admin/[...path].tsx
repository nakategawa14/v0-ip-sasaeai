import { useLocalSearchParams } from "expo-router"

import { AdminWebRedirectScreen } from "@/components/admin/AdminWebRedirectScreen"

/** `/admin/reports` など → Next.js 管理画面の同パスへ */
export default function AdminWebRedirectPage() {
  const { path } = useLocalSearchParams<{ path?: string | string[] }>()
  const segments = Array.isArray(path) ? path : path ? [path] : []
  const adminPath = segments.length > 0 ? `/admin/${segments.join("/")}` : "/admin"

  return <AdminWebRedirectScreen adminPath={adminPath} />
}
