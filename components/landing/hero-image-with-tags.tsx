"use client"

import Image from "next/image"

export function HeroImageWithTags() {
  return (
    <div className="mx-auto max-w-5xl">
      {/* メイン画像（ロゴ合成済み） */}
      <div className="relative overflow-hidden">
        <Image
          src="/images/20260103-1sasaeai02.jpg"
          alt="多様な4人の仲間たち"
          width={1200}
          height={600}
          className="h-auto w-full"
        />

        {/* タグオーバーレイ - 足元に配置 */}
        {/* 左端の黒スーツ女性 */}
        <div className="absolute bottom-[8%] left-[8%] z-20 flex flex-col gap-2">
          <span className="rounded-full bg-pink-200 px-4 py-2 text-base font-semibold text-pink-900 shadow-lg">
            健常者です
          </span>
          <span className="rounded-full bg-rose-200 px-4 py-2 text-base font-semibold text-rose-900 shadow-lg">
            きょうだい児です
          </span>
        </div>

        {/* 車椅子の方 */}
        <div className="absolute bottom-[8%] left-[30%] z-20 flex flex-col gap-2">
          <span className="rounded-full bg-emerald-200 px-4 py-2 text-base font-semibold text-emerald-900 shadow-lg">
            身体障がい
          </span>
          <span className="rounded-full bg-teal-200 px-4 py-2 text-base font-semibold text-teal-900 shadow-lg">
            ASDグレー
          </span>
        </div>

        {/* ベージュセーターの女性 - 右に移動して膝のあたりに配置 */}
        <div className="absolute bottom-[35%] left-[56%] z-20 flex flex-col gap-2">
          <span className="rounded-full bg-green-200 px-4 py-2 text-base font-semibold text-green-900 shadow-lg">
            統合失調症
          </span>
          <span className="rounded-full bg-lime-200 px-4 py-2 text-base font-semibold text-lime-900 shadow-lg">
            持病があります
          </span>
        </div>

        {/* 右端の紺スーツ男性 - お腹（へそ）あたりに移動 */}
        <div className="absolute bottom-[40%] right-[8%] z-20 flex flex-col gap-2">
          <span className="rounded-full bg-blue-200 px-4 py-2 text-base font-semibold text-blue-900 shadow-lg">
            健常者です
          </span>
          <span className="rounded-full bg-indigo-200 px-4 py-2 text-base font-semibold text-indigo-900 shadow-lg">
            LGBTQ当事者
          </span>
        </div>
      </div>

      {/* 画像の説明文 */}
      <p className="mt-4 text-center text-sm text-gray-600">誰もが自分らしく、安心して出会える場所</p>
    </div>
  )
}
