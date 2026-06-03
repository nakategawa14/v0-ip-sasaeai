import { useLocalSearchParams } from "expo-router"

import { AdminWebRedirectScreen } from "@/components/admin/AdminWebRedirectScreen"

/** `/home/admin/reports` など → Next.js の `/admin/reports` へ */
export default function HomeAdminWebRedirectPage() {
  const { path } = useLocalSearchParams<{ path?: string | string[] }>()
  const segments = Array.isArray(path) ? path : path ? [path] : []
  const adminPath = `/admin/${segments.join("/")}`

  return <AdminWebRedirectScreen adminPath={adminPath} />
}
