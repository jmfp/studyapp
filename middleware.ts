import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSession, updateSession } from './app/auth/auth'
import { redirect } from 'next/navigation'

export async function middleware(request: NextRequest) {
  var session = await getSession()
  if(!session){
    return await NextResponse.redirect(new URL('/admin/login', request.url))
  }
  console.log(session)
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|auth|admin/login|favicon.ico|blog|robots.txt|images|projects|$).*)', 
  ],
}
