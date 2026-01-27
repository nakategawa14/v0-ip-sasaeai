// プロフィール選択肢の定数定義

export const PREFECTURES_WITH_REGIONS: Record<string, string[]> = {
  北海道: ["道央", "道南", "道北", "道東"],
  青森県: ["津軽", "南部", "下北"],
  岩手県: ["県北", "県央", "沿岸", "県南"],
  宮城県: ["仙台", "県北", "県南", "三陸沿岸"],
  秋田県: ["県北", "中央", "県南"],
  山形県: ["村山", "最上", "置賜", "庄内"],
  福島県: ["会津", "中通り", "浜通り"],
  茨城県: ["県北", "県央", "県南", "県西", "鹿行"],
  栃木県: ["県北", "県央", "県南"],
  群馬県: ["北毛", "中毛", "東毛", "西毛"],
  埼玉県: ["北部", "南部", "西部", "東部", "秩父"],
  千葉県: ["北西部", "北東部", "南部"],
  東京都: ["23区", "多摩", "島しょ部"],
  神奈川県: ["横浜・川崎", "県央", "湘南", "県西"],
  新潟県: ["上越", "中越", "下越", "佐渡"],
  富山県: ["呉東", "呉西"],
  石川県: ["能登", "加賀"],
  福井県: ["嶺北", "嶺南"],
  山梨県: ["峡東", "峡中", "峡南", "富士・東部"],
  長野県: ["北信", "中信", "東信", "南信"],
  岐阜県: ["飛騨", "美濃"],
  静岡県: ["東部", "中部", "西部"],
  愛知県: ["尾張", "西三河", "東三河"],
  三重県: ["北勢", "中勢", "南勢", "伊賀", "東紀州"],
  滋賀県: ["湖東", "湖西", "湖南", "湖北"],
  京都府: ["南部", "山城", "中部", "丹後"],
  大阪府: ["北部", "中部", "南部"],
  兵庫県: ["播磨", "但馬", "丹波", "淡路", "神戸"],
  奈良県: ["北部", "中部", "南部"],
  和歌山県: ["北部", "中部", "南部"],
  鳥取県: ["東部", "中部", "西部"],
  島根県: ["出雲", "石見", "隠岐"],
  岡山県: ["備前", "備中", "美作"],
  広島県: ["備後", "安芸"],
  山口県: ["周南", "山口・防府", "下関", "岩国", "長門"],
  徳島県: ["北部", "南部"],
  香川県: ["東讃", "中讃", "西讃", "小豆島"],
  愛媛県: ["東予", "中予", "南予"],
  高知県: ["中部", "東部", "西部"],
  福岡県: ["北九州", "福岡", "筑豊", "筑後"],
  佐賀県: ["北部", "南部"],
  長崎県: ["長崎", "佐世保", "島原", "五島", "壱岐・対馬"],
  熊本県: ["熊本", "阿蘇", "天草", "県北", "県南"],
  大分県: ["北部", "中部", "南部", "西部"],
  宮崎県: ["北部", "中央", "南部"],
  鹿児島県: ["北薩", "中薩", "南薩", "大隅", "奄美群島", "種子島・屋久島"],
  沖縄県: ["本島北部", "中部", "南部", "宮古", "八重山"],
}

export const PREFECTURES = [
  { value: "北海道", label: "北海道" },
  { value: "青森県", label: "青森県" },
  { value: "岩手県", label: "岩手県" },
  { value: "宮城県", label: "宮城県" },
  { value: "秋田県", label: "秋田県" },
  { value: "山形県", label: "山形県" },
  { value: "福島県", label: "福島県" },
  { value: "茨城県", label: "茨城県" },
  { value: "栃木県", label: "栃木県" },
  { value: "群馬県", label: "群馬県" },
  { value: "埼玉県", label: "埼玉県" },
  { value: "千葉県", label: "千葉県" },
  { value: "東京都", label: "東京都" },
  { value: "神奈川県", label: "神奈川県" },
  { value: "新潟県", label: "新潟県" },
  { value: "富山県", label: "富山県" },
  { value: "石川県", label: "石川県" },
  { value: "福井県", label: "福井県" },
  { value: "山梨県", label: "山梨県" },
  { value: "長野県", label: "長野県" },
  { value: "岐阜県", label: "岐阜県" },
  { value: "静岡県", label: "静岡県" },
  { value: "愛知県", label: "愛知県" },
  { value: "三重県", label: "三重県" },
  { value: "滋賀県", label: "滋賀県" },
  { value: "京都府", label: "京都府" },
  { value: "大阪府", label: "大阪府" },
  { value: "兵庫県", label: "兵庫県" },
  { value: "奈良県", label: "奈良県" },
  { value: "和歌山県", label: "和歌山県" },
  { value: "鳥取県", label: "鳥取県" },
  { value: "島根県", label: "島根県" },
  { value: "岡山県", label: "岡山県" },
  { value: "広島県", label: "広島県" },
  { value: "山口県", label: "山口県" },
  { value: "徳島県", label: "徳島県" },
  { value: "香川県", label: "香川県" },
  { value: "愛媛県", label: "愛媛県" },
  { value: "高知県", label: "高知県" },
  { value: "福岡県", label: "福岡県" },
  { value: "佐賀県", label: "佐賀県" },
  { value: "長崎県", label: "長崎県" },
  { value: "熊本県", label: "熊本県" },
  { value: "大分県", label: "大分県" },
  { value: "宮崎県", label: "宮崎県" },
  { value: "鹿児島県", label: "鹿児島県" },
  { value: "沖縄県", label: "沖縄県" },
]

export const AREAS: Record<string, { value: string; label: string }[]> = Object.fromEntries(
  Object.entries(PREFECTURES_WITH_REGIONS).map(([pref, regions]) => [
    pref,
    regions.map((region) => ({ value: region, label: region })),
  ]),
)

export const BODY_TYPES = ["スリム", "普通", "むっちり", "がっちり", "ちょいぽちゃ", "ぽちゃ", "ふくよか", "ドスコイ"]

export const MBTI_TYPES = [
  "ISTJ",
  "ISFJ",
  "INFJ",
  "INTJ",
  "ISTP",
  "ISFP",
  "INFP",
  "INTP",
  "ESTP",
  "ESFP",
  "ENFP",
  "ENTP",
  "ESTJ",
  "ESFJ",
  "ENFJ",
  "ENTJ",
  "わからない",
]

export const PURPOSE_OPTIONS = ["友活", "恋活", "婚活"]

export const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "LGBTQ当事者" },
]

export const EMPLOYMENT_STATUS = ["働いてる", "働いてない", "休んでいる", "探している・訓練中"]

export const EMPLOYMENT_TYPE = [
  "就労移行支援",
  "A型、B型事業所",
  "特例子会社",
  "一般企業で一般雇用",
  "一般企業で障害者雇用",
  "自営その他",
]

export const ANNUAL_INCOME = ["0～100", "100～300", "300～600", "600以上"]

export const LIVING_SITUATION = ["ひとりで", "家族、友人と", "グループホーム", "入院中", "その他"]

export const FAMILY_RELATIONSHIP = ["仲良し", "普通", "悪い", "絶縁状態", "その他"]

export const MARITAL_STATUS = ["未婚", "離婚", "死別"]

export const CHILDREN_STATUS = ["いない", "同居", "別居"]

export const INDEPENDENCE_LEVEL = ["完全に自立", "ほぼ自立", "たまに介助が必要", "ほぼ毎日介助が必要"]

export const SMOKING_STATUS = ["吸う", "吸わない"]

export const MOOD_DISORDERS = ["うつ病", "双極性障害"]
export const ANXIETY_DISORDERS = ["不安障害", "強迫性障害", "適応障害", "パニック障害"]
export const DEVELOPMENTAL_DISORDERS = ["ADHD", "ASD", "LD", "その他"]
export const TRAUMA_DISORDERS = ["PTSD", "その他"]

export const INTELLECTUAL_LEVELS = ["境界知能", "軽度（B2や4度）", "中度（B1や3度）", "重度（A2や2度）", "わからない"]
export const THERAPY_HANDBOOKS = ["愛の手帳", "みどりの手帳", "愛護手帳", "療育手帳"]

export const DISEASE_CATEGORIES: Record<string, string[]> = {
  神経筋疾患: ["もやもや病", "パーキンソン病", "筋ジストロフィー", "その他"],
  免疫系疾患: ["関節リウマチ", "全身性エリテマトーデス", "その他"],
  血液系疾患: ["再生不良性貧血", "血小板減少症", "その他"],
  内分泌代謝: ["糖尿病", "甲状腺疾患", "その他"],
  呼吸器系: ["間質性肺炎", "肺線維症", "その他"],
  循環器系: ["心筋症", "不整脈", "その他"],
  消化器系: ["クローン病", "潰瘍性大腸炎", "その他"],
  腎泌尿器: ["慢性腎臓病", "ネフローゼ症候群", "その他"],
  皮膚結合: ["強皮症", "皮膚筋炎", "その他"],
  視覚聴覚: ["網膜色素変性症", "感音性難聴", "その他"],
  染色体遺伝: ["ダウン症候群", "その他"],
}

export const TAG_OPTIONS: Record<string, { label: string; tags: string[]; color: string }> = {
  relationship: {
    label: "関係性",
    tags: [
      "友達も恋人も探し中",
      "良い人がいれば交際したい",
      "友情結婚希望",
      "まずは友達から",
      "真剣な出会い希望",
      "性的なことが苦手",
      "コミュ力低い",
    ],
    color: "pink",
  },
  interests: {
    label: "興味・趣味",
    tags: [
      "食べることが好き",
      "韓国料理",
      "寿司",
      "邦楽",
      "ROCK",
      "SPY×FAMILY",
      "映画鑑賞",
      "読書",
      "アニメ",
      "ゲーム",
      "散歩",
      "カラオケ",
    ],
    color: "orange",
  },
  disability: {
    label: "障がい・難病情報",
    tags: [
      "健常者です",
      "理解ある健常者",
      "きょうだい児です",
      "グレーゾーンです",
      "持病があります",
      "障害があります",
      "障害者手帳を持っています",
      "知的障がい",
      "統合失調症",
      "双極性障害",
      "うつ病",
      "ADHD",
      "ASD",
      "難病、難病以外の持病がある",
    ],
    color: "green",
  },
  purpose: {
    label: "目的",
    tags: ["友活", "恋活", "婚活"],
    color: "blue",
  },
  employmentType: {
    label: "就労形態",
    tags: ["就労移行支援", "A型、B型事業所", "特例子会社", "一般企業で一般雇用", "一般企業で障害者雇用", "自営その他"],
    color: "purple",
  },
  independenceLevel: {
    label: "自立度",
    tags: ["完全に自立", "ほぼ自立", "たまに介助が必要", "ほぼ毎日介助が必要"],
    color: "teal",
  },
}

export const USER_TYPES = [
  { value: "supporter", label: "サポーター" },
  { value: "challenger", label: "チャレンジャー" },
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "LGBTQ当事者" },
]

export const DISABILITY_TYPES = ["精神障がい", "知的障がい", "身体障がい", "難病", "発達障がい", "その他"]

export const REGION_GROUPS: Record<string, string[]> = {
  "北海道/東北": ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  関東: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
  "甲信越/北陸": ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県"],
  東海: ["岐阜県", "静岡県", "愛知県", "三重県"],
  近畿: ["滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
  "中国/四国": ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"],
  "九州/沖縄": ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
}

export const MBTI_DESCRIPTIONS: Record<string, string> = {
  ISTJ: "管理者型",
  ISFJ: "擁護者型",
  INFJ: "提唱者型",
  INTJ: "建築家型",
  ISTP: "巨匠型",
  ISFP: "冒険家型",
  INFP: "仲介者型",
  INTP: "論理学者型",
  ESTP: "起業家型",
  ESFP: "エンターテイナー型",
  ENFP: "広報運動家型",
  ENTP: "討論者型",
  ESTJ: "幹部型",
  ESFJ: "領事官型",
  ENFJ: "主人公型",
  ENTJ: "指揮官型",
  わからない: "診断していない",
}
