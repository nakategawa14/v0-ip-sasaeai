import FontAwesome from "@expo/vector-icons/FontAwesome"
import { useRouter } from "expo-router"
import { Pressable, StyleSheet, Text } from "react-native"

type Props = {
  /** 既定は「戻る」。編集画面などでは「キャンセル」に変更可能 */
  label?: string
}

export function StackBackButton({ label = "戻る" }: Props) {
  const router = useRouter()
  return (
    <Pressable
      style={styles.wrap}
      onPress={() => router.back()}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <FontAwesome name="chevron-left" size={18} color="#db2777" />
      <Text style={styles.txt}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingRight: 8,
  },
  txt: {
    marginLeft: 2,
    fontSize: 17,
    fontWeight: "600",
    color: "#db2777",
  },
})
