'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'
import { v4 as uuidv4 } from 'uuid'
import SupabaseImage from '@/components/ui/SupabaseImage'

export default function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  const supabase = createClient()
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)
        
        // Get profile data
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        if (error && error.code !== 'PGRST116') {
          throw error
        }
        
        if (profile) {
          setFullName(profile.full_name || '')
          setAvatarUrl(profile.avatar_url)
          
          // Debug: Log the avatar URL
          console.log('Avatar URL from database:', profile.avatar_url)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProfile()
  }, [supabase])
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    
    setIsSaving(true)
    setMessage(null)
    
    try {
      let newAvatarUrl = avatarUrl
      
      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `${userId}/${fileName}`
        
        console.log('Uploading to path:', filePath)
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile)
          
        if (uploadError) {
          throw new Error(`Error uploading avatar: ${uploadError.message}`)
        }
        
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        newAvatarUrl = data.publicUrl
        
        console.log('New avatar URL:', newAvatarUrl)
        
        // Delete old avatar if exists
        if (avatarUrl && !avatarUrl.startsWith('data:')) {
          const oldAvatarPath = new URL(avatarUrl).pathname.split('/').pop()
          if (oldAvatarPath) {
            await supabase.storage.from('avatars').remove([`${userId}/${oldAvatarPath}`])
          }
        }
      }
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        
      if (error) throw error
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setMessage({ type: 'error', text: errorMessage })
      console.error('Error updating profile:', err)
    } finally {
      setIsSaving(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
      
      {message && (
        <div className={`p-4 mb-6 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <div>
          <label htmlFor="avatar-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture
          </label>
          <div className="flex items-center space-x-6">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100">
              {avatarUrl ? (
                avatarUrl.startsWith('data:') ? (
                  // For data URLs (local preview), use Next.js Image
                  <SupabaseImage
                    src={avatarUrl}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  // For Supabase URLs, use a regular img tag with more robust error handling
                  <SupabaseImage
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover absolute inset-0"
                  />
                )
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-500 text-2xl">
                    {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              aria-label="Choose profile picture"
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Your full name"
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}