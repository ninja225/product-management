'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center">
                <div className="relative w-8 h-8 mr-2">
                  <Image 
                    src="/logo.png" 
                    alt="Renta Logo" 
                    fill 
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-700">
                  Renta
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 rounded-md"
              >
                Войти
              </Link>
              <Link
                href="/signup"
                className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Регистрация
              </Link>
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