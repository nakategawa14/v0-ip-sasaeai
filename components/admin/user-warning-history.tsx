"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock } from "lucide-react"
import { getUserWarnings, getWarningStats } from "@/lib/actions/warnings"

interface UserWarningHistoryProps {
  userId: string
}

export function UserWarningHistory({ userId }: UserWarningHistoryProps) {
  const [warnings, setWarnings] = useState<any[]>([])
  const [stats, setStats] = useState<{
    total: number
    warning: number
    serious_warning: number
    final_warning: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const [warningsResult, statsResult] = await Promise.all([getUserWarnings(userId), getWarningStats(userId)])
      setWarnings(warningsResult.warnings)
      setStats(statsResult)
      setLoading(false)
    }
    loadData()
  }, [userId])

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            警告
          </Badge>
        )
      case "serious_warning":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            重大な警告
          </Badge>
        )
      case "final_warning":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            最終警告
          </Badge>
        )
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            警告履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          警告履歴
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats && stats.total > 0 && (
          <div className="flex gap-4 mb-4 p-3 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">合計</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
              <div className="text-xs text-muted-foreground">警告</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.serious_warning}</div>
              <div className="text-xs text-muted-foreground">重大</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.final_warning}</div>
              <div className="text-xs text-muted-foreground">最終</div>
            </div>
          </div>
        )}

        {warnings.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">警告履歴はありません</p>
        ) : (
          <div className="space-y-3">
            {warnings.map((warning) => (
              <div key={warning.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  {getSeverityBadge(warning.severity)}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(warning.created_at).toLocaleString("ja-JP")}
                  </span>
                </div>
                <p className="text-sm">{warning.reason}</p>
                {warning.acknowledged_at && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ 確認済み ({new Date(warning.acknowledged_at).toLocaleDateString("ja-JP")})
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
