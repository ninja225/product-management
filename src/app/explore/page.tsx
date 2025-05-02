'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase'
import { Search, UserCheck, UsersRound, AlertCircle, Heart, X, Activity } from 'lucide-react'
import { debounce } from 'lodash'
import Link from 'next/link'
import SupabaseImage from '@/components/ui/SupabaseImage'
import { toast } from 'react-hot-toast'

type Profile = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  cover_image_url: string | null
  is_public?: boolean
  like_count?: number
  dislike_count?: number
  total_interests?: number
}

export default function DiscoveryPage() {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Fetch all public profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUser(user.id)
        }
        
        // Fetch profiles that are set to public or don't have is_public flag set (default to showing them)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, cover_image_url, is_public')
          .order('created_at', { ascending: false })
          
        if (error) {
          throw error
        }
        
        // Filter to only include public profiles or profiles without the is_public flag
        const publicProfiles = (data || []).filter(
          profile => profile.is_public !== false
        )
        
        // Fetch interest counts for each profile
        const profilesWithInterests = await Promise.all(
          publicProfiles.map(async (profile) => {
            try {
              // Count likes (left)
              const { data: likeData, error: likeError } = await supabase
                .from('products')
                .select('id', { count: 'exact' })
                .eq('user_id', profile.id)
                .eq('display_section', 'left')
                
              if (likeError) throw likeError
              
              // Count dislikes (right)
              const { data: dislikeData, error: dislikeError } = await supabase
                .from('products')
                .select('id', { count: 'exact' })
                .eq('user_id', profile.id)
                .eq('display_section', 'right')
                
              if (dislikeError) throw dislikeError
              
              const likeCount = likeData?.length || 0
              const dislikeCount = dislikeData?.length || 0
                
              return {
                ...profile,
                like_count: likeCount,
                dislike_count: dislikeCount,
                total_interests: likeCount + dislikeCount
              }
            } catch (err) {
              console.error(`Error fetching interests for user ${profile.id}:`, err)
              return {
                ...profile,
                like_count: 0,
                dislike_count: 0,
                total_interests: 0
              }
            }
          })
        )
        
        setProfiles(profilesWithInterests)
        setFilteredProfiles(profilesWithInterests)
      } catch (err) {
        console.error('Error loading profiles:', err)
        setError('Не удалось загрузить профили. Пожалуйста, попробуйте еще раз позже.')
        toast.error('Ошибка при загрузке данных')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProfiles()
  }, [supabase])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setIsSearching(true)
      
      if (!query.trim()) {
        setFilteredProfiles(profiles)
        setIsSearching(false)
        return
      }
      
      const lowercaseQuery = query.toLowerCase().trim()
      
      const filtered = profiles.filter((profile) => {
        const username = profile.username?.toLowerCase() || ''
        const fullName = profile.full_name?.toLowerCase() || ''
        
        return (
          username.includes(lowercaseQuery) ||
          fullName.includes(lowercaseQuery)
        )
      })
      
      setFilteredProfiles(filtered)
      setIsSearching(false)
    }, 300),
    [profiles]
  )

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    debouncedSearch(query)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <AlertCircle size={40} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Произошла ошибка</h2>
        <p className="text-gray-600 mb-4 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#3d82f7] text-white rounded-md hover:bg-[#2d6ce0] transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  return (
    <div className="pb-10">
      {/* Page title and search */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Открытие</h1>
            <p className="text-gray-600">Найдите интересных пользователей и их интересы</p>
          </div>
          
          {/* Search input */}
          <div className="w-full md:w-64 mt-4 md:mt-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Поиск по имени или никнейму..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full shadow-sm focus:border-[#3d82f7] focus:outline-none focus:ring-1 focus:ring-[#3d82f7] text-black transition-all duration-200"
                disabled={isLoading}
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="h-4 w-4 border-t-2 border-[#3d82f7] rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Users grid */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-6">
          <UsersRound className="h-6 w-6 text-[#3d82f7] mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">Пользователи</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse relative">
                <div className="h-24 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 pt-14 pb-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-px bg-gray-200 w-full my-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
                {/* Avatar skeleton properly positioned as part of the card */}
                <div className="absolute top-16 left-4">
                  <div className="w-16 h-16 rounded-full border-3 border-white bg-gray-200"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProfiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/profile/${profile.username || profile.id}`}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] relative"
              >
                {/* Cover image */}
                <div className="h-24 bg-gradient-to-r from-[#3d82f7] to-[#56ccf2] relative">
                  {profile.cover_image_url && (
                    <SupabaseImage
                      src={profile.cover_image_url}
                      alt="Cover"
                      className="w-full h-full object-cover absolute"
                      fallback={<div className="w-full h-full bg-gradient-to-r from-[#3d82f7] to-[#56ccf2]"></div>}
                    />
                  )}
                </div>
                
                {/* Avatar - positioned to overlap the cover and content areas */}
                <div className="absolute top-16 left-4">
                  <div className="w-16 h-16 rounded-full border-3 border-white overflow-hidden bg-white shadow-md">
                    {profile.avatar_url ? (
                      <SupabaseImage
                        src={profile.avatar_url}
                        alt={`${profile.full_name || profile.username || 'Пользователь'}`}
                        className="w-full h-full object-cover"
                        fallback={
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xl font-bold">
                            {(profile.full_name?.[0] || profile.username?.[0] || 'U').toUpperCase()}
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xl font-bold">
                        {(profile.full_name?.[0] || profile.username?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Content area with proper padding for avatar space */}
                <div className="px-4 pt-14 pb-4">
                  <div className="mb-1 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-lg text-gray-900 truncate">
                        {profile.full_name || 'Пользователь'}
                      </h3>
                      {profile.username && (
                        <p className="text-gray-500 text-sm truncate">@{profile.username}</p>
                      )}
                    </div>
                    
                    {profile.id === currentUser && (
                      <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs whitespace-nowrap">
                        <UserCheck size={14} className="mr-1" />
                        <span>Это вы</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Interest counts with separator */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Heart size={16} className="text-green-500" />
                          <span className="text-sm font-medium text-gray-700">{profile.like_count || 0}</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1">
                          <X size={16} className="text-red-500" /> {/* Changed from ThumbsDown to X icon */}
                          <span className="text-sm font-medium text-gray-700">{profile.dislike_count || 0}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-100 px-2 py-1 rounded-full">
                        <div className="flex items-center">
                          <Activity size={14} className="text-[#3d82f7] mr-1" />
                          <span className="text-xs font-medium text-gray-700">
                            {profile.total_interests || 0} {(profile.total_interests || 0) === 1 ? 'интерес' : ((profile.total_interests || 0) >= 2 && (profile.total_interests || 0) <= 4) ? 'интереса' : 'интересов'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <UsersRound size={32} className="text-gray-400" />
            </div>
            {searchQuery.trim() !== '' ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Никого не найдено</h3>
                <p className="text-gray-500 max-w-md">
                  Не удалось найти пользователей, соответствующих вашему запросу. Попробуйте другой поисковый запрос.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Пользователей не найдено</h3>
                <p className="text-gray-500 max-w-md">
                  В настоящее время на платформе нет доступных пользователей.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}