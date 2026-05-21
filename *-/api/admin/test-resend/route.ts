import { NextResponse } from "next/server"

export async function GET() {
  console.log("[v0] Testing Resend API Key")
  console.log("[v0] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY)
  console.log("[v0] RESEND_API_KEY length:", process.env.RESEND_API_KEY?.length)
  console.log(
    "[v0] All env keys:",
    Object.keys(process.env).filter((k) => k.includes("RESEND")),
  )

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "RESEND_API_KEY not found",
        availableKeys: Object.keys(process.env).filter((k) => k.includes("RESEND")),
      },
      { status: 500 },
    )
  }

  // Resendライブラリのテスト
  try {
    const { Resend } = await import("resend")
    const resend = new Resend(apiKey)

    return NextResponse.json({
      success: true,
      message: "Resend client initialized successfully",
      apiKeyPrefix: apiKey.substring(0, 8) + "...",
      apiKeyLength: apiKey.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to initialize Resend",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
