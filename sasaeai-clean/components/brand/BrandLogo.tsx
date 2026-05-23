import { Image, type ImageStyle } from "expo-image"
import type { StyleProp } from "react-native"

const source = require("../../assets/images/logo-puzzle.png")

type Props = {
  /** 正方形の一辺（px） */
  size?: number
  style?: StyleProp<ImageStyle>
}

/** アプリブランド用パズルロゴ（ハートアイコンの置き換え） */
export function BrandLogo({ size = 48, style }: Props) {
  return (
    <Image
      source={source}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      accessibilityRole="image"
      accessibilityLabel="ささえ愛"
    />
  )
}
