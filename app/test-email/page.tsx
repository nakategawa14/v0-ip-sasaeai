"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestEmailPage() {
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    console.log("[v0 Test] Button clicked")
    setLoading(true)
    setResult("テスト中...")

    try {
      const response = await fetch("/api/admin/send-bulk-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "テストメール",
          body: "これはテストメールです",
          recipientType: "all",
        }),
      })

      const data = await response.json()
      console.log("[v0 Test] Response:", data)
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error("[v0 Test] Error:", error)
      setResult(`エラー: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>メール送信テストページ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTest} disabled={loading}>
            {loading ? "送信中..." : "テストメール送信"}
          </Button>

          {result && <pre className="bg-gray-100 p-4 rounded overflow-auto">{result}</pre>}
        </CardContent>
      </Card>
    </div>
  )
}
