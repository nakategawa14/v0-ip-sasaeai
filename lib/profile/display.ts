/**
 * Web 版 components/profile/profile-view.tsx の表示ロジックを抜粋。
 * 型は DB 行のゆるい形（未使用カラムは無視）。
 */
export type SasaeaiProfileRow = Record<string, unknown> & {
  id: string
  nickname?: string | null
  /** pending | approved | rejected など（DB 想定） */
  verification_status?: string | null
  birth_date?: string | null
  gender?: string | null
  prefecture?: string | null
  city?: string | null
  hometown?: string | null
  favorite_areas?: string | null
  bio?: string | null
  user_type?: string | null
  profile_images?: unknown
  profile_image_url?: string | null
  profile_image_1?: string | null
  profile_image_2?: string | null
  profile_image_3?: string | null
  tags?: unknown
  is_verified?: boolean | null
  /** ON のとき、いいねした相手にのみ一覧・プロフィールを公開する想定 */
  is_secret_mode?: boolean | null
  is_active?: boolean | null
  purpose?: string | string[] | null
  preferred_gender?: string[] | unknown | null
  height?: number | string | null
  employment_type?: string | null
  employment_status?: string | null
  occupation?: string | null
  annual_income?: string | null
  living_situation?: string | null
  family_relationship?: string | null
  can_go_out_alone?: boolean | null
  independence_level?: string | null
  supporter_message?: string | null
}

export function calculateAge(birthDate: string): number | undefined {
  const today = new Date()
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return undefined
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/** 画像として読み込める URL か（誤ってニックネーム等が入ったカラム値を除外する） */
export function isLikelyImageFetchUrl(s: string | null | undefined): boolean {
  if (typeof s !== "string") return false
  const t = s.trim()
  if (t.length < 8) return false
  const lower = t.toLowerCase()
  if (lower.startsWith("http://") || lower.startsWith("https://")) return true
  if (lower.startsWith("//")) return true
  if (lower.startsWith("file://")) return true
  if (lower.startsWith("data:image/")) return true
  return false
}

/** //example.com 形式を React Native の Image で読めるようにする */
function finalizeDisplayImageUrl(s: string): string {
  const t = s.trim()
  if (t.toLowerCase().startsWith("//")) return `https:${t}`
  return t
}

/** 配列要素から表示用 URL 文字列を取り出す（文字列 / { url } / { src } など） */
function stringFromProfileImageItem(item: unknown): string | null {
  if (typeof item === "string") {
    const t = item.trim()
    return t.length ? t : null
  }
  if (item && typeof item === "object") {
    const o = item as Record<string, unknown>
    for (const key of ["url", "src", "href", "path"] as const) {
      const v = o[key]
      if (typeof v === "string" && v.trim()) return v.trim()
    }
  }
  return null
}

/** profile_images（配列 or JSON 文字列）を URL 候補の配列に正規化 */
export function profileImagesAsUrlCandidates(pi: unknown): string[] {
  if (!pi) return []
  let arr: unknown[] = []
  if (Array.isArray(pi)) arr = pi
  else if (typeof pi === "string") {
    try {
      const parsed = JSON.parse(pi) as unknown
      if (Array.isArray(parsed)) arr = parsed
    } catch {
      return []
    }
  }
  const out: string[] = []
  for (const item of arr) {
    const s = stringFromProfileImageItem(item)
    if (s) out.push(s)
  }
  return out
}

/**
 * メイン表示用画像 URL。
 * Web 検索の UserCard と同様に **profile_images の先頭から** 利用可能な画像 URL を優先する。
 * （profile_image_1 にニックネーム等の誤データが入っているケースで、配列の本物の URL が使えるようにする）
 */
export function getProfileImageUrl(profile: SasaeaiProfileRow): string | null {
  for (const s of profileImagesAsUrlCandidates(profile.profile_images)) {
    if (isLikelyImageFetchUrl(s)) return finalizeDisplayImageUrl(s)
  }

  const p1 = typeof profile.profile_image_1 === "string" ? profile.profile_image_1.trim() : ""
  if (p1 && isLikelyImageFetchUrl(p1)) return finalizeDisplayImageUrl(p1)

  const pu = typeof profile.profile_image_url === "string" ? profile.profile_image_url.trim() : ""
  if (pu && isLikelyImageFetchUrl(pu)) return finalizeDisplayImageUrl(pu)

  for (const key of ["profile_image_2", "profile_image_3"] as const) {
    const raw = profile[key]
    const v = typeof raw === "string" ? raw.trim() : ""
    if (v && isLikelyImageFetchUrl(v)) return finalizeDisplayImageUrl(v)
  }

  return null
}

export function getSubImageUrls(profile: SasaeaiProfileRow): string[] {
  const out: string[] = []
  if (typeof profile.profile_image_2 === "string" && isLikelyImageFetchUrl(profile.profile_image_2)) {
    out.push(profile.profile_image_2.trim())
  }
  if (typeof profile.profile_image_3 === "string" && isLikelyImageFetchUrl(profile.profile_image_3)) {
    out.push(profile.profile_image_3.trim())
  }
  return out
}

export function parseProfileTags(profile: SasaeaiProfileRow): string[] {
  const raw = profile.tags
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === "string")
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((t): t is string => typeof t === "string")
      }
    } catch {
      return []
    }
  }
  return []
}

export function genderLabel(gender: string | null | undefined): string {
  if (gender === "male") return "男性"
  if (gender === "female") return "女性"
  if (gender === "other") return "その他"
  return gender ?? ""
}

export function userTypeLabel(userType: string | null | undefined): string | undefined {
  if (userType === "person_with_disability") return "障がいのある方"
  if (userType === "chronic_illness") return "難病の方"
  if (userType === "supporter") return "サポーター"
  if (userType === "challenger") return "チャレンジャー"
  if (userType === "male") return "男性"
  if (userType === "female") return "女性"
  if (userType === "other") return "その他"
  return userType ?? undefined
}

export function employmentTypeLabel(v: string | null | undefined): string | undefined {
  if (v === "full_time") return "正社員"
  if (v === "part_time") return "パート・アルバイト"
  if (v === "contract") return "契約社員・派遣社員"
  if (v === "self_employed") return "自営業・フリーランス"
  if (v === "unemployed") return "無職"
  if (v === "student") return "学生"
  if (v === "retired") return "退職"
  if (v === "other") return "その他"
  return v ?? undefined
}

export function annualIncomeLabel(v: string | null | undefined): string | undefined {
  if (v === "under_2m") return "200万円未満"
  if (v === "2m_4m") return "200万円〜400万円未満"
  if (v === "4m_6m") return "400万円〜600万円未満"
  if (v === "6m_8m") return "600万円〜800万円未満"
  if (v === "8m_10m") return "800万円〜1,000万円未満"
  if (v === "over_10m") return "1,000万円以上"
  if (v === "prefer_not_to_say") return "回答しない"
  return v ?? undefined
}

export function livingSituationLabel(v: string | null | undefined): string | undefined {
  if (v === "alone") return "一人暮らし"
  if (v === "with_family") return "家族と同居"
  if (v === "with_partner") return "パートナーと同居"
  if (v === "group_home") return "グループホーム"
  if (v === "facility") return "施設"
  if (v === "other") return "その他"
  return v ?? undefined
}

export function verificationStatusLabel(status: unknown): string {
  if (status === "pending") return "審査中（提出済み）"
  if (status === "approved") return "確認済み"
  if (status === "rejected") return "再提出が必要です"
  if (status == null || status === "") return "未提出 / 未設定"
  return String(status)
}

export function birthDateDisplay(birth: unknown): string {
  if (typeof birth !== "string" || !birth.trim()) return "未登録"
  const d = new Date(birth)
  if (Number.isNaN(d.getTime())) return birth
  return d.toLocaleDateString("ja-JP")
}

export function purposeList(profile: SasaeaiProfileRow): string[] {
  const p = profile.purpose
  if (Array.isArray(p)) return p.filter((x): x is string => typeof x === "string")
  if (typeof p === "string" && p.trim()) return [p]
  return []
}

export function favoriteAreasJoined(favoriteAreas: string | null | undefined): string | undefined {
  if (!favoriteAreas) return undefined
  return favoriteAreas
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .join("、")
}
