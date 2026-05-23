/**
 * Android 11+ のパッケージ可視性対策: https / http の VIEW を canOpenURL で解決できるよう
 * <queries> をマージする（開発ビルド・本番ビルド向け。Expo Go はホストアプリのマニフェスト依存）。
 * @type {import("@expo/config-plugins").ConfigPlugin}
 */
const { withAndroidManifest } = require("expo/config-plugins")

function withAndroidHttpsQueries(config) {
  return withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application?.[0]
    if (!app) return mod

    const block = {
      intent: [
        {
          action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
          data: [{ $: { "android:scheme": "https" } }],
        },
      ],
    }
    const blockHttp = {
      intent: [
        {
          action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
          data: [{ $: { "android:scheme": "http" } }],
        },
      ],
    }

    const existing = app.queries
    const list = Array.isArray(existing) ? [...existing] : existing ? [existing] : []
    const json = JSON.stringify(list)
    if (!json.includes("https")) list.push(block)
    if (!json.includes("http")) list.push(blockHttp)
    app.queries = list
    return mod
  })
}

module.exports = withAndroidHttpsQueries
