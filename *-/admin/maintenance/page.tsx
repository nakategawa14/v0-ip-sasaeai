import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertCircle, Key } from "lucide-react"

export default function MaintenanceControlPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">メンテナンスモード管理</h1>
          <p className="text-muted-foreground">サイトのメンテナンスモードを管理します</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              現在のステータス
            </CardTitle>
            <CardDescription>メンテナンスモードは現在有効です</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div>
                <p className="font-semibold text-orange-900">メンテナンスモード: 有効</p>
                <p className="text-sm text-orange-700">一般ユーザーはサイトにアクセスできません</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>

            <div className="space-y-2">
              <Label>メンテナンスモードを無効にする</Label>
              <p className="text-sm text-muted-foreground">
                proxy.ts ファイルの MAINTENANCE_MODE を false に変更してください
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-500" />
              管理者バイパスキー
            </CardTitle>
            <CardDescription>テストアクセス用のシークレットキー</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bypass-key">バイパスキー</Label>
              <Input id="bypass-key" type="text" readOnly value="sasaeai-test-2024" className="font-mono" />
              <p className="text-sm text-muted-foreground">
                環境変数 MAINTENANCE_BYPASS_KEY で変更できます（未設定時はこのデフォルト値）
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <p className="font-semibold text-blue-900">テストアクセス方法:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>任意のページのURLに ?bypass=sasaeai-test-2024 を追加</li>
                <li>例: https://your-site.com?bypass=sasaeai-test-2024</li>
                <li>アクセス後、7日間メンテナンスモードがバイパスされます</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label>現在のバイパス URL例</Label>
              <div className="p-3 bg-muted rounded font-mono text-sm break-all">
                {typeof window !== "undefined" ? window.location.origin : "https://your-site.com"}
                ?bypass=sasaeai-test-2024
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>セキュリティに関する注意事項</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>バイパスキーは関係者以外に共有しないでください</li>
              <li>本番環境では必ず環境変数でキーを設定してください</li>
              <li>テスト完了後はブラウザのクッキーをクリアすることを推奨します</li>
              <li>警察への届出が完了したら、メンテナンスモードを無効にしてください</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
