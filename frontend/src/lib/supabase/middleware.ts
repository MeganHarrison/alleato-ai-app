import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Retrieve the authenticated user
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user
  const pathname = request.nextUrl.pathname

  // Define public paths (no login required)
  const publicPaths = [
    '/',
    '/chat',
    '/ChatKitDemo',
    '/auth',
    '/login',
    '/signup',
    '/forgot-password',
    '/api/auth',
    '/api/chatkit',
    '/debug',
    '/projects',
  ]

  const isPublicPath = publicPaths.some(path =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  )

  const isAuthPath = ['/login', '/signup', '/auth'].some(path =>
    pathname.startsWith(path)
  )

  // --- REDIRECT LOGIC ---

  // 1. Not logged in → redirect to login if private path
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // 2. Logged in → redirect away from login/signup/auth pages
  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard' // 👈 change this to your main app route
    return NextResponse.redirect(url)
  }

  // 3. Default: return the updated Supabase response
  return supabaseResponse
}
