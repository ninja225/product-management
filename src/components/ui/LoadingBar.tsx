'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface LoadingBarProps {
    color?: string;
    height?: number;
    duration?: number;
    className?: string;
}

/**
 * A custom loading bar component that automatically shows during navigation
 * More lightweight than NProgress for simpler use cases
 */
export default function LoadingBar({
    color = '#3d82f7',
    height = 3,
    duration = 400,
    className = ''
}: LoadingBarProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [firstRender, setFirstRender] = useState(true)

    useEffect(() => {
        setFirstRender(false)
    }, [])

    useEffect(() => {
        if (firstRender) return

        // Start loading
        setLoading(true)

        // Complete loading after duration
        const timer = setTimeout(() => {
            setLoading(false)
        }, duration)

        return () => clearTimeout(timer)
    }, [pathname, searchParams, duration, firstRender])

    return (
        <div
            className={`fixed top-0 left-0 z-50 w-full pointer-events-none transition-all duration-300 ${className}`}
            style={{
                opacity: loading ? 1 : 0,
                transition: `opacity ${duration / 2}ms ease-in-out`,
            }}
        >
            <div
                className="h-full w-full relative"
                style={{
                    height: `${height}px`,
                    background: `linear-gradient(to right, transparent, ${color}, transparent)`,
                    animation: loading ? `progressAnimation ${duration * 0.8}ms ease-in-out` : 'none',
                }}
            />
            <style jsx>{`
        @keyframes progressAnimation {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
        </div>
    )
}
