// 準備中モードの設定
// MAINTENANCE_MODE=true の場合、ホワイトリストに登録されたメールアドレスのみ登録・ログイン可能

export const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"

// ホワイトリスト: 管理者・協力者のメールアドレス
// 既存のテストユーザーも含む
export const WHITELIST_EMAILS = [
  // 管理者
  "tobiuotsukai@gmail.com",
  "nurekoinu-shop1@yahoo.co.jp",
  // 協力者（必要に応じて追加）
  // テストユーザー
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

// ホワイトリストに含まれるかチェック
export function isWhitelisted(email: string): boolean {
  if (!MAINTENANCE_MODE) return true
  return WHITELIST_EMAILS.some((whitelistedEmail) => whitelistedEmail.toLowerCase() === email.toLowerCase())
}
