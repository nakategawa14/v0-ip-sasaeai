import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import sharp from "sharp"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[v0] Upload API: No user authenticated")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const imageType = formData.get("type") as string

    console.log("[v0] Upload API: Received request", {
      fileName: file?.name,
      fileSize: file?.size,
      imageType,
      userId: user.id,
    })

    if (!file) {
      console.error("[v0] Upload API: No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!["profile", "id_verification", "selfie_verification"].includes(imageType)) {
      console.error("[v0] Upload API: Invalid image type", imageType)
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const compressedBuffer = await sharp(buffer)
      .resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 60, progressive: true })
      .toBuffer()

    // ファイル名にユーザーIDとタイムスタンプを含める
    const timestamp = Date.now()
    const filename = `${user.id}/${imageType}_${timestamp}_${file.name.replace(/\.[^/.]+$/, "")}.jpg`

    console.log("[v0] Upload API: Uploading to Blob", { filename, size: compressedBuffer.length })

    // Vercel Blobにアップロード
    const blob = await put(filename, compressedBuffer, {
      access: "public",
      contentType: "image/jpeg",
    })

    console.log("[v0] Upload API: Upload successful", { url: blob.url })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: compressedBuffer.length,
      type: "image/jpeg",
    })
  } catch (error) {
    console.error("[v0] Upload API: Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
