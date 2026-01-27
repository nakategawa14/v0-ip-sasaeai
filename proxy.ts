import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// 認証が必要なパス
const PROTECTED_PATHS = [
  "/dashboard",
  "/profile",
  "/messages",
  "/search",
  "/matches",
  "/likes",
  "/footprints",
  "/settings",
  "/upgrade",
  "/payment",
  "/admin",
]

// 認証済みユーザーがアクセスすべきでないパス
const AUTH_PATHS = ["/login", "/signup"]

// 公開パス（認証不要）
const PUBLIC_PATHS = ["/", "/pricing", "/terms", "/privacy", "/legal", "/contact", "/faq"]

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // セッションを更新（重要：getUser()でトークンを検証）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 保護されたパスへのアクセスチェック
  const isProtectedPath = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  // 認証パスへのアクセスチェック
  const isAuthPath = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  // 未認証ユーザーが保護されたパスにアクセスした場合
  if (isProtectedPath && !user) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 認証済みユーザーがログイン/登録ページにアクセスした場合
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのリクエストパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - 画像ファイル (.svg, .png, .jpg, .jpeg, .gif, .webp)
     * - API routes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
}
