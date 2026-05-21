/** 特商法表記・問い合わせ等で共通利用する運営者情報 */
export const OPERATOR_INFO = {
  name: "ささえ愛運営事務局",
  representative: "栗手川純一",
  address: "茨城県取手市戸頭6-1-2",
  email: "tobiuotsukai+sasaeai@gmail.com",
} as const

export const SUPPORT_MAILTO = `mailto:${OPERATOR_INFO.email.replace("+", "%2B")}?subject=${encodeURIComponent("ささえ愛についてのお問い合わせ")}`
