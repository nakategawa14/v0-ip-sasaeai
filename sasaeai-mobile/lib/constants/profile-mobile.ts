/** Web の profile-options / setup フォームに合わせたモバイル用の抜粋（親リポジトリ非依存） */

export const USER_TYPES = [
  { value: "supporter", label: "サポーター" },
  { value: "challenger", label: "チャレンジャー" },
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "LGBTQ当事者" },
] as const

export const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
] as const

export const PURPOSE_OPTIONS = [
  { value: "友活", label: "友活" },
  { value: "恋活", label: "恋活" },
  { value: "婚活", label: "婚活" },
] as const

export const LIVING_OPTIONS = [
  { value: "alone", label: "一人暮らし" },
  { value: "with_family", label: "家族と同居" },
  { value: "with_partner", label: "パートナーと同居" },
  { value: "group_home", label: "グループホーム" },
  { value: "facility", label: "施設" },
  { value: "other", label: "その他" },
] as const

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "正社員" },
  { value: "part_time", label: "パート・アルバイト" },
  { value: "contract", label: "契約社員・派遣社員" },
  { value: "self_employed", label: "自営業・フリーランス" },
  { value: "unemployed", label: "無職" },
  { value: "student", label: "学生" },
  { value: "retired", label: "退職" },
  { value: "other", label: "その他" },
] as const

export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const

export const TAG_POOL = [
  "友達も恋人も探し中",
  "真剣な出会い希望",
  "まずは友達から",
  "映画鑑賞",
  "読書",
  "散歩",
  "カラオケ",
  "ゲーム",
  "理解ある健常者",
  "障害者手帳を持っています",
  "難病、難病以外の持病がある",
] as const
