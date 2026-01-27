"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function ContactMessagesList({
  messages,
  currentStatus,
}: {
  messages: any[]
  currentStatus?: string
}) {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex gap-2">
          <Link href="/admin/contact">
            <Badge variant={!currentStatus ? "default" : "outline"}>全て</Badge>
          </Link>
          <Link href="/admin/contact?status=pending">
            <Badge variant={currentStatus === "pending" ? "default" : "outline"}>未対応</Badge>
          </Link>
          <Link href="/admin/contact?status=responded">
            <Badge variant={currentStatus === "responded" ? "default" : "outline"}>返信済み</Badge>
          </Link>
          <Link href="/admin/contact?status=resolved">
            <Badge variant={currentStatus === "resolved" ? "default" : "outline"}>解決済み</Badge>
          </Link>
        </div>
      </Card>

      <div className="space-y-4">
        {messages.length > 0 ? (
          messages.map((message) => (
            <Card key={message.id} className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <Badge
                      variant={
                        message.status === "pending"
                          ? "destructive"
                          : message.status === "resolved"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {message.status === "pending"
                        ? "未対応"
                        : message.status === "responded"
                          ? "返信済み"
                          : "解決済み"}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {new Date(message.created_at).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{message.subject}</h3>
                  <p className="mb-4 text-gray-700 whitespace-pre-wrap">{message.message}</p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>送信者: {message.user?.display_name || "不明"}</span>
                    <span>|</span>
                    <span>{message.user?.email || "不明"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/contact/${message.id}`}>
                    <Badge variant="outline">返信する</Badge>
                  </Link>
                </div>
              </div>

              {message.admin_response && (
                <div className="mt-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                  <p className="mb-1 text-sm font-medium text-blue-900">管理者からの返信:</p>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{message.admin_response}</p>
                  {message.responded_at && (
                    <p className="mt-2 text-xs text-blue-600">
                      {new Date(message.responded_at).toLocaleString("ja-JP")}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-600">問い合わせはありません</p>
          </Card>
        )}
      </div>
    </div>
  )
}
