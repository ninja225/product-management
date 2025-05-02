'use client'

import Link from 'next/link'
// import Image from 'next/image'
import { LogIn, UserPlus, Menu, X, Home, Share2, LogOut, Settings, Compass } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'
import { toast } from 'react-hot-toast'

export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const supabase = createClient()
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
        
        if (user) {
          // Get username for share functionality
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single()
            
          if (profile?.username) {
            setUsername(profile.username)
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [supabase])
  
  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640 && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileMenuOpen])
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Не удалось выйти из системы')
    } finally {
      setIsLoggingOut(false)
    }
  }
  
  const handleShare = async () => {
    if (username) {
      try {
        const shareUrl = `${window.location.origin}/profile/${username}`
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Ссылка на профиль скопирована!')
      } catch (error) {
        console.error('Error sharing profile:', error)
        toast.error('Не удалось скопировать ссылку на профиль')
      }
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restyled Navigation - now always white with clean modern look */}
      <nav className="top-0 left-0 right-0 z-10 bg-white shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-16">
            {/* Mobile menu button - moved to left side but kept visible on small screens */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors duration-300"
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen ? "true" : "false"}
                aria-label="Main menu"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
            
            {/* Left side links - hidden on mobile */}
            <div className="hidden sm:flex items-center space-x-6 flex-1">
              {isAuthenticated ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="px-2 py-1 text-sm font-medium rounded-md flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors duration-300"
                  >
                    <Home className="w-4 h-4" />
                    <span>Главная</span>
                  </Link>
                  <Link 
                    href="/explore" 
                    className="px-2 py-1 text-sm font-medium rounded-md flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors duration-300"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Открытие</span>
                  </Link>
                </>
              ) : (
                <Link 
                  href="/" 
                  className="px-2 py-1 text-sm font-medium rounded-md flex items-center space-x-1 text-gray-700 hover:text-gray-900 transition-colors duration-300"
                >
                  <Home className="w-4 h-4" />
                  <span>Главная</span>
                </Link>
              )}
            </div>
            
            {/* Centered logo with Open in green and Mind in red */}
            <div className="flex items-center justify-center">
              <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center">
                <span className="text-2xl font-extrabold">
                  <span className="text-green-600">Open</span>
                  <span className="text-red-600">Mind</span>
                </span>
              </Link>
            </div>
            
            {/* Right side menu items */}
            <div className="flex items-center flex-1 justify-end">
              {!isLoading && (
                <div className="hidden sm:flex items-center space-x-3">
                  {isAuthenticated ? (
                    // Show authenticated user options
                    <>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="cursor-pointer px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-1 text-[#3d82f7] hover:text-[#2d6ce0] hover:bg-gray-200 transition-colors duration-300"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Поделиться</span>
                      </button>
                      <Link 
                        href="/dashboard/profile" 
                        className="p-2 rounded-md flex items-center justify-center text-gray-700 hover:text-[#2d6ce0] hover:bg-gray-200 transition-colors duration-300"
                        aria-label="Настройки профиля"
                        title="Настройки профиля"
                      >
                        <Settings className="w-5 h-5" />
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="cursor-pointer px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-2 bg-[#3d82f7] text-white hover:bg-[#2d6ce0] disabled:opacity-50 transition-colors duration-300"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{isLoggingOut ? 'Выход...' : 'Выйти'}</span>
                      </button>
                    </>
                  ) : (
                    // Show login/signup options for unauthenticated users
                    <>
                      <Link 
                        href="/login" 
                        className="px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-2 text-[#3d82f7] hover:text-[#2d6ce0] hover:bg-gray-200 transition-colors duration-300"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Войти</span>
                      </Link>
                      <Link
                        href="/signup"
                        className="px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-2 bg-[#3d82f7] text-white hover:bg-[#2d6ce0] transition-colors duration-300"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Регистрация</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        <div 
          id="mobile-menu"
          className={`sm:hidden transition-all duration-300 ease-in-out transform ${
            mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 shadow-lg bg-white">
            {isAuthenticated ? (
              // Authenticated mobile menu
              <>
                <Link 
                  href="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-3 text-base font-medium rounded-md flex items-center space-x-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-300"
                >
                  <Home className="w-5 h-5" />
                  <span>Главная</span>
                </Link>
                <Link 
                  href="/explore" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-3 text-base font-medium rounded-md flex items-center space-x-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-300"
                >
                  <Compass className="w-5 h-5" />
                  <span>Открытие</span>
                </Link>
                <button
                  type="button"
                  onClick={handleShare}
                  className="cursor-pointer block w-full text-left px-3 py-3 text-base font-medium rounded-md flex items-center space-x-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-300"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Поделиться</span>
                </button>
                <Link 
                  href="/dashboard/profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-3 text-base font-medium rounded-md flex items-center space-x-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-300"
                >
                  <Settings className="w-5 h-5" />
                  <span>Настройки</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer block w-full text-left px-3 py-3 text-base font-medium rounded-md flex items-center space-x-3 text-red-600 hover:bg-red-50 transition-colors duration-300 disabled:opacity-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{isLoggingOut ? 'Выход из системы...' : 'Выйти'}</span>
                </button>
              </>
            ) : (
              // Unauthenticated mobile menu
              <>
                <Link 
                  href="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-3 text-base font-medium rounded-md flex items-center space-x-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-300"
                >
                  <Home className="w-5 h-5" />
                  <span>Главная</span>
                </Link>
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-3 text-base font-medium rounded-md flex items-center space-x-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-300"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Войти</span>
                </Link>
                <Link 
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-3 text-base font-medium rounded-md flex items-center space-x-3 bg-gray-800 text-white transition-colors duration-300"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Регистрация</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      
      {/* Main Content - Reduced padding-top to fix spacing */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pt-6">
        {children}
      </main>
    </div>
  )
}