import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Card } from "@/components/ui/card"
import { Heart } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Heart className="h-8 w-8 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-900">ささえ愛</h1>
          </Link>
          <p className="mt-2 text-gray-600">新しいパスワードの設定</p>
        </div>
        <ResetPasswordForm />
      </Card>
    </div>
  )
}
