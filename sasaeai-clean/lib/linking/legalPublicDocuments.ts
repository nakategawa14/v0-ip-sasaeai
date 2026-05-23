import * as ExpoLinking from "expo-linking"
import { Alert, Linking, Platform } from "react-native"

/** App Store 審査・同意導線用（システムブラウザで開く固定 URL） */
export const SASAEAI_PUBLIC_TERMS_URL = "https://sasaeai.help/terms"
export const SASAEAI_PUBLIC_PRIVACY_URL = "https://sasaeai.help/privacy"

/** @deprecated 互換用エイリアス（terms と同一） */
export const SASAEAI_TERMS_AND_PRIVACY_URL = SASAEAI_PUBLIC_TERMS_URL

/**
 * 利用規約・プライバシー等の公開ページを、ネイティブでは OS の既定ブラウザ（iOS: Safari）で開く。
 * Web は従来どおり `expo-linking`（同一タブ遷移が一般的）。
 */
export async function openLegalPublicHttpsInSystemBrowser(url: string): Promise<void> {
  if (Platform.OS === "web") {
    await ExpoLinking.openURL(url)
    return
  }
  try {
    await Linking.openURL(url)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    Alert.alert("エラー", `URL を開けませんでした。\n\n${msg}`)
  }
}

export async function openLegalPublicTermsInSystemBrowser(): Promise<void> {
  await openLegalPublicHttpsInSystemBrowser(SASAEAI_PUBLIC_TERMS_URL)
}

export async function openLegalPublicPrivacyInSystemBrowser(): Promise<void> {
  await openLegalPublicHttpsInSystemBrowser(SASAEAI_PUBLIC_PRIVACY_URL)
}

/** 「利用規約・プライバシーポリシー」まとめ行の入口（従来どおり terms 側） */
export async function openLegalPublicTermsEntryInSystemBrowser(): Promise<void> {
  await openLegalPublicTermsInSystemBrowser()
}

/** @deprecated `openLegalPublicTermsEntryInSystemBrowser` を使用 */
export async function openTermsAndPrivacyEntryInBrowser(): Promise<void> {
  await openLegalPublicTermsEntryInSystemBrowser()
}
