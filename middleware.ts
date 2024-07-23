import { NextResponse, type NextRequest } from 'next/server'
import { getSession, updateSession } from './app/auth/auth'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  var session = await getSession()
  await updateSession(request)
  if(!session && path !== "/signin"){
    return NextResponse.redirect(new URL('/signin', request.url))
  }
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
    '/((?!api|_next/static|_next/image|characters|auth|admin/login|favicon.ico|blog|robots.txt|images|projects|$).*)', 
  ],
}
