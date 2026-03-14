import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired — writes updated tokens back to cookies.
    // getUser() is preferred over getSession() as it validates with the Supabase server.
    await supabase.auth.getUser()

    return response
}

export const config = {
    matcher: [
        /*
         * Run on page routes only — skip API routes, static files, and images.
         * API routes authenticate via Authorization: Bearer header (getUserIdFromAuthToken),
         * not via cookies, so the middleware session refresh is not needed there.
         */
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
