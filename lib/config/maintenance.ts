// Web 版 lib/config/maintenance.ts と同じロジック（環境変数プレフィックスのみ Expo 用）

export const MAINTENANCE_MODE = process.env.EXPO_PUBLIC_MAINTENANCE_MODE === "true"

export const WHITELIST_EMAILS = [
  "tobiuotsukai@gmail.com",
  "nurekoinu-shop1@yahoo.co.jp",
  "tobiuotsukai+junya@gmail.com",
  "tobiuotsukai+natsuko@gmail.com",
  "tobiuotsukai+test1@gmail.com",
  "tobiuotsukai+test2@gmail.com",
  "tobiuotsukai+test3@gmail.com",
  "tobiuotsukai+test4@gmail.com",
  "tobiuotsukai+test5@gmail.com",
  "tobiuotsukai+test6@gmail.com",
  "tobiuotsukai+test7@gmail.com",
  "tobiuotsukai+test8@gmail.com",
  "tobiuotsukai+test9@gmail.com",
  "tobiuotsukai+test10@gmail.com",
]

export function isWhitelisted(email: string): boolean {
  if (!MAINTENANCE_MODE) return true
  return WHITELIST_EMAILS.some((w) => w.toLowerCase() === email.trim().toLowerCase())
}
