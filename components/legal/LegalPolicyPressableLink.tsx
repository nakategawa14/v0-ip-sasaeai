import { Pressable, Text, type StyleProp, type TextStyle } from "react-native"

import {
  openLegalPublicPrivacyInSystemBrowser,
  openLegalPublicTermsInSystemBrowser,
} from "@/lib/linking/legalPublicDocuments"

type Props = {
  kind: "terms" | "privacy"
  textStyle?: StyleProp<TextStyle>
}

export function LegalPolicyPressableLink({ kind, textStyle }: Props) {
  const label = kind === "terms" ? "利用規約" : "プライバシーポリシー"
  const onPress = () =>
    void (kind === "terms" ? openLegalPublicTermsInSystemBrowser() : openLegalPublicPrivacyInSystemBrowser())

  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={label} hitSlop={6}>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  )
}
