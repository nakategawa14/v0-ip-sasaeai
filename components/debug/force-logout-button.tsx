"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Loader2 } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function ForceLogoutButton({ className }: { className?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      setLoading(false)
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <Button type="button" variant="outline" onClick={() => void onClick()} disabled={loading} className={className}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
      強制ログアウト
    </Button>
  )
}

