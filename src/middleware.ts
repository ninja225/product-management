import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { SUPABASE_CONFIG } from './utils/supabase-config'

export async function middleware(request: NextRequest) {
  // Early return for non-matching paths (additional optimization)
  if (!request.nextUrl.pathname.startsWith('/dashboard') && 
      !request.nextUrl.pathname.startsWith('/login') && 
      !request.nextUrl.pathname.startsWith('/signup')) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Create Supabase client specifically for middleware using the centralized config
    const supabase = createServerClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Get the session first to check if it exists
    const { data: sessionData } = await supabase.auth.getSession()
    
    // Initialize user data to null by default
    let isAuthenticated = false
    let userId: string | null = null
    
    // Only try to get user data if we have a session
    if (sessionData?.session) {
      try {
        // Use getUser() which is more secure
        const { data, error } = await supabase.auth.getUser()
        
        if (!error && data.user) {
          isAuthenticated = true
          userId = data.user.id
        }
      } catch (authError) {
        // Ignore "Auth session missing" errors
        if (authError instanceof Error && 
            !authError.message.includes('Auth session missing')) {
          console.error('Auth error:', authError.message)
        }
      }
    }

    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                       request.nextUrl.pathname.startsWith('/signup')
    
    // If accessing home page while authenticated, redirect to dashboard
    if (isAuthenticated && request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If user is not authenticated and trying to access a protected route, redirect to login
    if (!isAuthenticated && isProtectedRoute) {
      // Preserve the original URL as a query parameter for redirecting back after login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (isAuthenticated && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Add user information to request headers for server components
    if (isAuthenticated && userId) {
      response.headers.set('x-user-id', userId)
    }

    return response
  } catch (e) {
    // Global error handling
    console.error('Middleware error:', e)
    
    // Only redirect to error page if on protected route
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login?error=auth_error', request.url))
    }
    
    return response
  }
}

// Keep the same matcher configuration
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup', '/'],
}