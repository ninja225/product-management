'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase'
import { useState } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold">
                Панель управления продуктом
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/profile" 
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-indigo-700"
              >
                Профиль
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-3 py-2 text-sm font-medium rounded-md bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50"
              >
                {isLoggingOut ? 'Выход из системы...' : 'Выйти'}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}