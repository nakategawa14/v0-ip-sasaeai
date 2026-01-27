"use client"

import { Card } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { Construction, Heart, Calendar, Mail, LogIn } from "lucide-react"
import Link from "next/link"

export function ComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mb-6 flex justify-center">
          <Logo className="h-16 w-auto" />
        </div>

        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-pink-100 to-purple-100">
            <Construction className="h-10 w-10 text-pink-500" />
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-bold text-gray-900">準備中です</h1>

        <p className="mb-6 text-lg text-gray-600 leading-relaxed">
          現在、サービス開始に向けて準備を進めております。
          <br />
          もうしばらくお待ちください。
        </p>

        <div className="mb-8 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 p-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-pink-500" />
            <span className="font-semibold text-gray-900">サービス開始予定</span>
          </div>
          <p className="text-2xl font-bold text-pink-600">2025年4月</p>
        </div>

        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-pink-500 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600">障がい者、難病の方、そして理解ある方のためのマッチングサービス</p>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-pink-500 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600">お問い合わせ: sasaeai.help@gmail.com</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-pink-600 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            関係者ログイン
          </Link>
        </div>
      </Card>
    </div>
  )
}
