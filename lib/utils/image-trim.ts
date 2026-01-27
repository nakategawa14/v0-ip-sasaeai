/**
 * 運転免許証画像を自動トリミングする
 * プライバシー保護のため、右端40mm（約47%）のみを切り出す
 * この範囲には「運転免許証」文字、生年月日、顔写真が含まれ、上部から下部まで完全に保存する
 */
export async function trimLicenseImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("Canvas context not available"))
      return
    }

    img.onload = () => {
      const originalWidth = img.width
      const originalHeight = img.height

      // 右端40mmは全体の約46.7% (32mm→40mmに拡大して生年月日を確実に含める)
      const trimPercentage = 0.47 // 40mm / 85.6mm
      const trimWidth = Math.floor(originalWidth * trimPercentage)

      // Canvasサイズを設定（右端のみ、上部から下部まで完全に保存）
      canvas.width = trimWidth
      canvas.height = originalHeight

      ctx.drawImage(
        img,
        originalWidth - trimWidth, // 切り出し開始位置（右端から40mm分）
        0, // y座標（上部から開始）
        trimWidth, // 切り出す幅
        originalHeight, // 切り出す高さ（全体の高さを保持）
        0, // Canvas上のx座標
        0, // Canvas上のy座標（上部から開始）
        trimWidth, // Canvas上の幅
        originalHeight, // Canvas上の高さ（全体の高さを保持）
      )

      // CanvasをBlobに変換
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"))
            return
          }

          // 元のファイル名に"-trimmed"を追加
          const fileName = file.name.replace(/(\.[^.]+)$/, "-trimmed$1")
          const trimmedFile = new File([blob], fileName, { type: file.type })
          resolve(trimmedFile)
        },
        file.type,
        0.95, // 画質
      )
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    // 画像を読み込み
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string
      }
    }
    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }
    reader.readAsDataURL(file)
  })
}
