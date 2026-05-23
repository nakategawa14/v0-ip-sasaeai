import { AdminWebRedirectScreen } from "@/components/admin/AdminWebRedirectScreen"

/** `/admin` → Next.js 管理ダッシュボード */
export default function AdminIndexRedirectPage() {
  return <AdminWebRedirectScreen adminPath="/admin" />
}
