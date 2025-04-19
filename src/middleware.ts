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

    const { data, error } = await supabase.auth.getSession()
    
    // Handle potential Supabase errors
    if (error) {
      console.error('Supabase auth error:', error.message)
      // On auth error, redirect to login as a fallback
      if (request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return response
    }

    const isAuthenticated = !!data.session
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
    if (isAuthenticated) {
      response.headers.set('x-user-id', data.session.user.id)
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