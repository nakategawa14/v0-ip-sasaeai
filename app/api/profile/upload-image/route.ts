import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const imageType = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!["profile", "id_verification", "selfie_verification"].includes(imageType)) {
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 })
    }

    // 🔥 そのままバイナリ化（sharpなし）
    const buffer = Buffer.from(await file.arrayBuffer())

    const timestamp = Date.now()
    const filename = `${user.id}/${imageType}_${timestamp}_${file.name.replace(/\.[^/.]+$/, "")}`

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type || "image/jpeg",
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: buffer.length,
      type: file.type,
    })
  } catch (error) {
    console.error("[Upload API Error]", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}