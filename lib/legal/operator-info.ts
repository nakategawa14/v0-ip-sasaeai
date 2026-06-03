/** Web の lib/legal/operator-info.ts と同一の運営者情報 */
export const OPERATOR_INFO = {
  name: "ささえ愛運営事務局",
  representative: "栗手川純一",
  address: "茨城県取手市戸頭6-1-2",
  email: "tobiuotsukai+sasaeai@gmail.com",
} as const

/** ホーム・設定など画面に表示する連絡先一行 */
export const CONTACT_DISPLAY_LINE = `連絡先：${OPERATOR_INFO.email}` as const

export const SUPPORT_MAILTO = `mailto:${OPERATOR_INFO.email.replace("+", "%2B")}?subject=${encodeURIComponent("ささえ愛についてのお問い合わせ")}`
