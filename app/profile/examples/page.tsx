import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Heart, Briefcase } from "lucide-react"

const sampleProfiles = [
  {
    id: "haruo",
    nickname: "サンプル春男",
    age: 45,
    gender: "男性",
    prefecture: "茨城県",
    city: "つくば、土浦",
    purpose: ["友活", "恋活"],
    disability: "精神障がい（双極性障害）",
    work: "一般企業で障害者雇用",
    bio: "大学生の頃に双極性障害を発病し、大学は中退せざるを得ない状況でした。以降はずっと障害者雇用で働いてました。実家住まいなのでなんとかなってます。歌が好きなんで一緒にカラオケ行ってくれる方と知り合いたいです。",
    faceImage: "/45-------------.jpg",
    fullImage: "/45-----------------.jpg",
  },
  {
    id: "natsuo",
    nickname: "サンプル夏男",
    age: 48,
    gender: "男性",
    prefecture: "千葉県",
    city: "柏、印西",
    purpose: ["恋活", "婚活"],
    disability: "身体障がい（脳卒中後遺症）",
    work: "A型、B型事業所",
    bio: "個人事業主で建築関係の職人をしておりましたが、脳卒中で倒れ、左半身麻痺の後遺症が残りました。子供は独立しています。",
    faceImage: "/48-------------.jpg",
    fullImage: "/48--------------.jpg",
  },
  {
    id: "akio",
    nickname: "サンプル秋男",
    age: 32,
    gender: "男性",
    prefecture: "茨城県",
    city: "土浦、取手",
    purpose: ["友活", "恋活"],
    disability: "精神障がい（INFJ）",
    work: "休んでいる（デイケア通所中）",
    bio: "発達障がいがあり、障がい者雇用で一般企業で働いていましたが、体調を崩し、退職し現在は休んでいます。",
    faceImage: "/32--------------.jpg",
    fullImage: "/32------------------.jpg",
  },
  {
    id: "haruko",
    nickname: "サンプルはるこ",
    age: 22,
    gender: "女性",
    prefecture: "茨城県",
    city: "つくば、水戸",
    purpose: ["友活"],
    disability: "発達障がい（ASD・ADHD）",
    work: "特例子会社（事務）",
    bio: "ASDです。就労移行へ通ってから、現在は特例子会社で事務の仕事をしています。人に話しかけられないので、女性の友達も募集です。音楽が好きでギターを練習しています。",
    faceImage: "/22----------------.jpg",
    fullImage: "/22-----------------.jpg",
  },
  {
    id: "natsuko",
    nickname: "サンプルナツコ",
    age: 34,
    gender: "女性",
    prefecture: "東京都",
    city: "立川、新宿、吉祥寺",
    purpose: ["婚活", "恋活"],
    disability: "発達障がい（ASD）、精神障がい（うつ、双極性障害、パニック障害）",
    work: "自営その他",
    bio: "3歳の子供と二人で暮らしているシングルマザーです。ADHDとパニック障害があります。パニックの方はほぼ寛解かと思います。離婚の理由はお話しできます。",
    faceImage: "/34----------------.jpg",
    fullImage: "/34--------------.jpg",
  },
  {
    id: "akiko",
    nickname: "サンプルあきこ",
    age: 24,
    gender: "女性",
    prefecture: "千葉県",
    city: "柏、上野",
    purpose: ["友活", "恋活"],
    disability: "発達障がい（ADHD）、精神障がい（境界性パーソナリティ障害）",
    work: "特例子会社",
    bio: "大学生の時に発病しました。大学卒業後、就労移行を経て現在特例子会社で働いています。通院し服薬していて、比較的安定していると思います。趣味でイラストを描いたりしています。優しくて誠実な方と知り合いになれたら嬉しいです。よろしくおねがいします。",
    faceImage: "/24-----------------.jpg",
    fullImage: "/24-----------------.jpg",
  },
  {
    id: "fuyuko",
    nickname: "サンプル冬子",
    age: 50,
    gender: "女性",
    prefecture: "東京都豊島区",
    city: "上野、吉祥寺",
    purpose: ["友活"],
    disability: "精神障がい（統合失調症スペクトラム）、発達障がい（ASD）",
    work: "自営その他（手芸品販売）",
    bio: "ASDです。いじめにあって高校中退です。お給料を貰う仕事についたことはありません。集団行動ができません。現在は趣味の手芸品をネット販売などしています。",
    faceImage: "/50------------------.jpg",
    fullImage: "/50---------------.jpg",
  },
]

export default function ProfileExamplesPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/profile/setup"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          プロフィール作成に戻る
        </Link>
        <h1 className="text-3xl font-bold">プロフィール見本</h1>
        <p className="mt-2 text-muted-foreground">
          こちらはプロフィールの記入例です。参考にしてあなたらしいプロフィールを作成してください。
        </p>
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            💡 自己PR文は詳しく書くとマッチ率が上がります
          </p>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            趣味や好きなこと、どんな方と知り合いたいかなど、具体的に書くことで、あなたに興味を持ってくれる方が増えます。
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {sampleProfiles.map((profile) => (
          <Card key={profile.id} className="overflow-hidden">
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={profile.faceImage || "/placeholder.svg"}
                    alt={`${profile.nickname}の顔写真`}
                    width={400}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="aspect-[2/3] overflow-hidden rounded-lg">
                  <Image
                    src={profile.fullImage || "/placeholder.svg"}
                    alt={`${profile.nickname}の全身写真`}
                    width={400}
                    height={600}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{profile.nickname}</h2>
                  <p className="text-muted-foreground">
                    {profile.age}歳・{profile.gender}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">居住地:</span>
                    <span>{profile.prefecture}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">よく行く街:</span>
                    <span>{profile.city}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.purpose.map((p) => (
                    <Badge key={p} variant="secondary">
                      {p}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-start gap-2">
                    <Heart className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.disability}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.work}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h3 className="mb-2 font-medium">自己PR</h3>
                  <p className="text-sm leading-relaxed">{profile.bio}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/profile/setup"
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          プロフィールを作成する
        </Link>
      </div>
    </div>
  )
}
