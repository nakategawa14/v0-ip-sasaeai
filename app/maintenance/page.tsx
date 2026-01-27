import { Logo } from "@/components/ui/logo"
import { Construction } from "lucide-react"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <Construction className="h-24 w-24 text-primary animate-pulse" />
          </div>

          <h1 className="text-3xl font-bold text-balance">ただいま準備中です</h1>

          <div className="space-y-3 text-muted-foreground">
            <p className="text-lg text-pretty">「ささえ愛」をご覧いただきありがとうございます。</p>
            <p className="text-pretty">
              現在、サービス開始に向けて準備を進めております。
              <br />
              関係機関への届出手続き中のため、今しばらくお待ちください。
            </p>
            <p className="text-sm text-pretty">準備が整い次第、こちらのページでお知らせいたします。</p>
          </div>
        </div>

        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground">お問い合わせ等がございましたら、下記までご連絡ください。</p>
          <p className="text-sm text-muted-foreground mt-2">support@sasaeai.example.com</p>
        </div>

        <div className="pt-4 text-xs text-muted-foreground/50">
          <p>管理者の方: テストアクセスには URL に ?bypass=シークレットキー を追加してください</p>
        </div>
      </div>
    </div>
  )
}
