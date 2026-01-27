"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toggleSecretMode } from "@/lib/actions/account"
import { useToast } from "@/hooks/use-toast"

export function SecretModeToggle({ isSecretMode }: { isSecretMode: boolean }) {
  const [enabled, setEnabled] = useState(isSecretMode)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleToggle = async () => {
    setLoading(true)
    const result = await toggleSecretMode()

    if (result.error) {
      toast({
        title: "エラー",
        description: result.error,
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    setEnabled(result.isSecretMode || false)
    toast({
      title: result.isSecretMode ? "シークレットモードをオンにしました" : "シークレットモードをオフにしました",
      description: result.isSecretMode ? "検索結果に表示されなくなりました" : "検索結果に表示されるようになりました",
    })
    setLoading(false)
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch id="secret-mode" checked={enabled} onCheckedChange={handleToggle} disabled={loading} />
      <Label htmlFor="secret-mode" className="cursor-pointer">
        {enabled ? "オン" : "オフ"}
      </Label>
    </div>
  )
}
