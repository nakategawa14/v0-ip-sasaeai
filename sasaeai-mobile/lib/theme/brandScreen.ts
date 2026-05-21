import { StyleSheet } from "react-native"

/** ささえ愛ブランド：ピンク〜水色の清潔感ある背景 */
export const brandScreen = StyleSheet.create({
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eff6ff",
    opacity: 0.45,
  },
  pageTint: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e0f0",
    padding: 16,
    shadowColor: "#db2777",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: "#db2777",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
})
