'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import NProgress from 'nprogress'
import '@/utils/nprogress-config'

interface NavigationEventsProps {
    color?: string;
    height?: number;
}

/**
 * A component that triggers the loading bar for page transitions
 * This uses internal Next.js events and hooks to ensure it works reliably
 */
export default function NavigationEvents({ color = '#3d82f7', height = 3 }: NavigationEventsProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const prevPathRef = useRef(pathname)
    const prevSearchParamsRef = useRef(searchParams)
    const navigationInProgressRef = useRef(false)
    const manualNavigationRef = useRef(false)
    const navigationStartTimeRef = useRef<number | null>(null)
    const [initialized, setInitialized] = useState(false)

    // Set up CSS styles for the loading bar
    useEffect(() => {
        try {
            const style = document.createElement('style')
            style.textContent = `
                #nprogress {
                    pointer-events: none;
                    z-index: 9999;
                }
                
                #nprogress .bar {
                    background: ${color};
                    position: fixed;
                    z-index: 9999;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: ${height}px;
                }
                
                #nprogress .peg {
                    display: block;
                    position: absolute;
                    right: 0px;
                    width: 100px;
                    height: 100%;
                    box-shadow: 0 0 10px ${color}, 0 0 5px ${color};
                    opacity: 1.0;
                    transform: rotate(3deg) translate(0px, -4px);
                }
            `
            document.head.appendChild(style)

            return () => {
                document.head.removeChild(style)
            }
        } catch (error) {
            console.error('Error applying NProgress styles:', error)
        }
    }, [color, height])

    // Start navigation indicator and reset timeout safety mechanism
    const startNavigation = useCallback(() => {
        if (navigationInProgressRef.current) return;

        navigationInProgressRef.current = true;
        navigationStartTimeRef.current = Date.now();

        try {
            NProgress.start();
        } catch (err) {
            console.error('NProgress failed to start:', err);
        }

        // Safety timeout: force completion if navigation takes too long
        setTimeout(() => {
            if (navigationInProgressRef.current && navigationStartTimeRef.current) {
                const elapsedTime = Date.now() - navigationStartTimeRef.current;
                if (elapsedTime > 8000) {
                    console.warn('Navigation timeout reached, forcing completion');
                    finishNavigation();
                }
            }
        }, 8000);
    }, []);

    // Complete navigation indicator with a small delay for visual smoothness
    const finishNavigation = useCallback(() => {
        // Ensure there's a minimum display time for the loading bar
        const minDisplayTime = 300 // ms
        const elapsedTime = navigationStartTimeRef.current ? Date.now() - navigationStartTimeRef.current : 0
        const remainingTime = Math.max(0, minDisplayTime - elapsedTime)

        setTimeout(() => {
            NProgress.done()
            navigationInProgressRef.current = false
            manualNavigationRef.current = false
            navigationStartTimeRef.current = null
        }, remainingTime)
    }, [])

    // Monitor navigation events including Link clicks
    useEffect(() => {
        if (!initialized) return

        try {
            // Detect any click on a link
            const handleDocumentClick = (e: MouseEvent) => {
                const target = e.target as HTMLElement
                const anchor = target.closest('a')

                if (
                    anchor &&
                    anchor.href &&
                    anchor.href.startsWith(window.location.origin) &&
                    !anchor.hasAttribute('download') &&
                    !anchor.getAttribute('target') &&
                    !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey &&
                    // Only trigger for links to different pages
                    new URL(anchor.href).pathname !== window.location.pathname
                ) {
                    // This is a link click that will cause a navigation within the app
                    manualNavigationRef.current = true
                    startNavigation()
                }
            }

            // Watch for navigation events from history API
            const handlePopState = () => {
                startNavigation()
            }

            document.addEventListener('click', handleDocumentClick, true)
            window.addEventListener('popstate', handlePopState)

            return () => {
                document.removeEventListener('click', handleDocumentClick, true)
                window.removeEventListener('popstate', handlePopState)
            }
        } catch (error) {
            console.error('Error setting up navigation event detection:', error)
        }
    }, [initialized, startNavigation])

    // Detect actual route changes via pathname and searchParams
    useEffect(() => {
        if (!initialized) return

        try {
            const prevPath = prevPathRef.current
            const prevSearchParams = prevSearchParamsRef.current

            // Update refs for next comparison
            prevPathRef.current = pathname
            prevSearchParamsRef.current = searchParams

            // Skip the initial load
            if (initialized) {
                // If this is a real route change (not just the initial load)
                const currentSearchParamsString = searchParams.toString()
                const prevSearchParamsString = prevSearchParams.toString()

                if (prevPath !== pathname || currentSearchParamsString !== prevSearchParamsString) {
                    // A navigation has completed
                    finishNavigation()
                }
            }
        } catch (error) {
            console.error('Error handling route change:', error)
            finishNavigation()
        }
    }, [pathname, searchParams, initialized])

    // Handle manual router.push/replace calls
    useEffect(() => {
        if (!initialized) return

        try {
            const originalPush = router.push.bind(router)
            const originalReplace = router.replace.bind(router)

            // Override router methods to track programmatic navigation
            router.push = (...args: Parameters<typeof router.push>) => {
                const url = args[0]

                // Check if it's a navigation to a different route
                if (typeof url === 'string' && url !== pathname) {
                    startNavigation()
                    manualNavigationRef.current = true
                }
                return originalPush(...args)
            }

            router.replace = (...args: Parameters<typeof router.replace>) => {
                const url = args[0]

                // Check if it's a navigation to a different route
                if (typeof url === 'string' && url !== pathname) {
                    startNavigation()
                    manualNavigationRef.current = true
                }
                return originalReplace(...args)
            }

            return () => {
                // Restore original methods
                router.push = originalPush
                router.replace = originalReplace
            }
        } catch (error) {
            console.error('Error overriding router methods:', error)
        }
    }, [router, pathname, initialized, startNavigation])

    // Initialize and show loading on first mount
    useEffect(() => {
        // Start with a loading indicator for initial page load
        NProgress.start()

        // Short delay to complete the initial loading
        const timer = setTimeout(() => {
            NProgress.done()
            setInitialized(true)
        }, 500)

        return () => {
            clearTimeout(timer)
            NProgress.done()
        }
    }, [])

    // This component doesn't render anything visible itself
    return null
}
