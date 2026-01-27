import { Badge } from "@/components/ui/badge"

interface ProfileTag {
  label: string
  category: "interest" | "lifestyle" | "personality" | "disability" | "other"
}

interface ProfileTagsProps {
  tags: ProfileTag[]
  maxDisplay?: number
}

const categoryColors = {
  interest: "bg-pink-100 text-pink-700 border-pink-300",
  lifestyle: "bg-orange-100 text-orange-700 border-orange-300",
  personality: "bg-yellow-100 text-yellow-700 border-yellow-300",
  disability: "bg-green-100 text-green-700 border-green-300",
  other: "bg-gray-100 text-gray-700 border-gray-300",
}

export function ProfileTags({ tags, maxDisplay }: ProfileTagsProps) {
  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags
  const remainingCount = maxDisplay && tags.length > maxDisplay ? tags.length - maxDisplay : 0

  return (
    <div className="flex flex-wrap gap-2">
      {displayTags.map((tag, index) => (
        <Badge key={index} variant="outline" className={categoryColors[tag.category]}>
          {tag.label}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="bg-gray-100 text-gray-600">
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}
