import type { Session, User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { router } from "expo-router"

import { TABLES } from "@/lib/constants/tables"
import { supabase } from "@/lib/supabase"

type AuthContextValue = {
  session: Session | null
  user: User | null
  initialized: boolean
  /** ログイン中のみ false。プロフィールの利用可否を確認してから true。 */
  accessGateResolved: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [accessGateResolved, setAccessGateResolved] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!cancelled) {
        setSession(s)
        setInitialized(true)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const uid = session?.user?.id
    if (!uid) {
      setAccessGateResolved(true)
      return
    }

    setAccessGateResolved(false)
    let cancelled = false

    void (async () => {
      const { data, error } = await supabase.from(TABLES.PROFILES).select("status").eq("id", uid).maybeSingle()
      if (cancelled) return
      if (error) {
        console.warn("[AuthContext] profile status check:", error.message)
      }
      if (data?.status === "blocked") {
        await supabase.auth.signOut()
        if (!cancelled) {
          router.replace("/(auth)/login?blocked=1")
        }
        return
      }
      if (!cancelled) setAccessGateResolved(true)
    })()

    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      initialized,
      accessGateResolved,
    }),
    [session, initialized, accessGateResolved],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
