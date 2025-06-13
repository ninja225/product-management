'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'

export default function AuthDebugPanel() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setSession(currentSession)
        setUser(currentUser)
        setIsLoading(false)
        console.log('Debug - Session:', currentSession)
        console.log('Debug - User:', currentUser)
      } catch (error) {
        console.error('Debug - Error:', error)
        setIsLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Debug - Auth event:', event, session)
      setSession(session)
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p>🔄 Loading auth state...</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="font-bold mb-2">🔐 Auth Debug Panel</h3>
      <div className="space-y-2 text-sm">
        <p><strong>Status:</strong> {user ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
        {user && (
          <>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Provider:</strong> {user.app_metadata?.provider || 'email'}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </>
        )}
        {session && (
          <p><strong>Session expires:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
        )}
      </div>
    </div>
  )
}