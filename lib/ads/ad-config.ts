// 広告設定ファイル
export const adConfig = {
  amazon: {
    affiliateId: "YOUR_AMAZON_AFFILIATE_ID", // Amazonアソシエイトタグに置き換え
    enabled: true,
  },
  rakuten: {
    roomId: "YOUR_RAKUTEN_ROOM_ID", // 楽天ROOMのIDに置き換え
    enabled: true,
  },
  // 広告表示頻度（無料会員のみ）
  displayFrequency: {
    freeUsers: true, // 無料会員に広告を表示
    paidUsers: false, // 有料会員には広告を表示しない
  },
}
