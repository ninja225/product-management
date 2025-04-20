'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase'
import { useState, useEffect } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Navigation - now sticky with transition effects */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-10 transition-all duration-300 ${
          scrolled 
            ? 'bg-white shadow-md text-indigo-700' 
            : 'bg-indigo-600 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center">
                {/* Logo */}
                <div className="relative w-8 h-8 mr-2">
                  <Image 
                    src="/logo.png" 
                    alt="Renta Logo" 
                    fill 
                    className="object-contain"
                  />
                </div>
                {/* Enhanced site title with gradient animation */}
                <span className={`text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${
                  scrolled 
                    ? 'from-indigo-700 via-blue-600 to-indigo-700' 
                    : 'from-blue-200 via-white to-blue-200'
                } animate-gradient bg-size-200 transition-colors duration-300`}>
                  Renta
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/profile" 
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  scrolled 
                    ? 'hover:bg-indigo-100' 
                    : 'hover:bg-indigo-700'
                } transition-colors duration-300`}
              >
                Профиль
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  scrolled 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-indigo-700 hover:bg-indigo-800'
                } disabled:opacity-50 transition-colors duration-300`}
              >
                {isLoggingOut ? 'Выход из системы...' : 'Выйти'}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content - Added padding to account for fixed navbar */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pt-20">
        {children}
      </main>
    </div>
  )
}