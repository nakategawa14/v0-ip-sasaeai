import { Card } from "@/components/ui/card"
import { Heart, Mail } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
            <Mail className="h-8 w-8 text-pink-600" />
          </div>
        </div>

        <h1 className="mb-4 text-2xl font-bold text-gray-900">メールをご確認ください</h1>

        <p className="mb-6 text-gray-600 leading-relaxed">
          ご登録いただいたメールアドレスに確認メールを送信しました。
          メール内のリンクをクリックして、登録を完了してください。
        </p>

        <div className="rounded-lg bg-blue-50 p-4 text-sm text-gray-700">
          <p className="mb-2 font-semibold">メールが届かない場合</p>
          <ul className="space-y-1 text-left">
            <li>• 迷惑メールフォルダをご確認ください</li>
            <li>• メールアドレスが正しいかご確認ください</li>
            <li>• 数分待ってから再度お試しください</li>
          </ul>
        </div>

        <div className="mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700">
            <Heart className="h-4 w-4" />
            トップページに戻る
          </Link>
        </div>
      </Card>
    </div>
  )
}
