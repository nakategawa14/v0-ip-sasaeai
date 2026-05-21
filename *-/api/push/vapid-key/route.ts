import { NextResponse } from "next/server"

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!publicKey) {
    return NextResponse.json({ publicKey: null, error: "VAPID公開鍵が設定されていません" }, { status: 500 })
  }

  return NextResponse.json({ publicKey })
}
