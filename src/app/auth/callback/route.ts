import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'
import { SUPABASE_CONFIG } from '@/utils/supabase-config'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const redirectTo = requestUrl.searchParams.get('redirectTo')

    if (code) {
        const supabase = createServerClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    }, set(name: string, value: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        await supabase.auth.exchangeCodeForSession(code)

        // Get user info to determine redirect
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            // Check if user has a profile/username
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single()

            // Determine redirect URL
            let finalRedirect = '/'

            if (redirectTo) {
                finalRedirect = redirectTo
            } else if (profile?.username) {
                finalRedirect = `/profile/${profile.username}`
            } else {
                finalRedirect = `/profile/${user.id}`
            }

            return NextResponse.redirect(new URL(finalRedirect, request.url))
        }
    }

    // If something went wrong, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
}
