import FontAwesome from "@expo/vector-icons/FontAwesome"
import { useCallback, useEffect, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"

import { calculateAge, genderLabel, getProfileImageUrl, type SasaeaiProfileRow } from "@/lib/profile/display"

type Props = {
  profile: SasaeaiProfileRow
  cardWidth: number
  onPress: () => void
}

export function UserGridCard({ profile, cardWidth, onPress }: Props) {
  const uri = getProfileImageUrl(profile)
  const [imgFailed, setImgFailed] = useState(false)
  useEffect(() => {
    setImgFailed(false)
  }, [profile.id, uri])
  const onImgError = useCallback(() => setImgFailed(true), [])
  const showImage = Boolean(uri) && !imgFailed
  const age =
    profile.birth_date && typeof profile.birth_date === "string" ? calculateAge(profile.birth_date) : undefined
  const loc =
    typeof profile.prefecture === "string"
      ? `${profile.prefecture}${profile.city ? ` ${String(profile.city)}` : ""}`
      : ""

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { width: cardWidth }]}
      accessibilityRole="button"
      accessibilityLabel={`${profile.nickname}のプロフィールへ`}
    >
      <View style={styles.imageWrap}>
        {showImage ? (
          <Image source={{ uri: uri! }} style={styles.image} resizeMode="cover" onError={onImgError} />
        ) : (
          <View style={[styles.image, styles.imageFallback]} accessibilityLabel="プロフィール写真なし">
            <FontAwesome name="user" size={36} color="#db2777" />
          </View>
        )}
        {profile.is_verified ? (
          <View style={styles.verified}>
            <FontAwesome name="check" size={10} color="#fff" />
          </View>
        ) : null}
      </View>
      <Text style={styles.nick} numberOfLines={1}>
        {profile.nickname}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {age != null ? `${age}歳` : ""}
        {age != null && profile.gender ? " · " : ""}
        {profile.gender ? genderLabel(String(profile.gender)) : ""}
      </Text>
      <View style={styles.locRow}>
        <FontAwesome name="map-marker" size={11} color="#6b7280" />
        <Text style={styles.loc} numberOfLines={1}>
          {loc || "居住地未設定"}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8e0f0",
    padding: 10,
    marginBottom: 12,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrap: {
    position: "relative",
    marginBottom: 8,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  imageFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fce7f3",
  },
  verified: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  nick: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  loc: {
    flex: 1,
    fontSize: 11,
    color: "#6b7280",
  },
})
