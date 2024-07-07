import {createMiddlewareClient} from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest){
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({req, res})
    const {data:{
        session
    }, error} = await supabase.auth.getSession()
    //redirecting if not logged in
    if(!session){
        return NextResponse.rewrite(new URL('/admin/login', req.url))
    }

    return res
}

export const config = {
    matcher: [
       '/admin/dashboard/:path*', '/admin/posts/:path*'
    ]
}