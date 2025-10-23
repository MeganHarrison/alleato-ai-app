import { createSupabaseClient } from '@/lib/supabase'

export async function middleware(req: NextRequest) {
  const supabase = createSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthRoute = req.nextUrl.pathname.startsWith('/auth')
  const isPublicPath = isAuthRoute || req.nextUrl.pathname.startsWith('/api/auth')

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return NextResponse.next()
}
