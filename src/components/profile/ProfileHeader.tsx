'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'
import SupabaseImage from '@/components/ui/SupabaseImage'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'

interface ProfileHeaderProps {
  userId: string
  tagFilter?: string
  onTagFilterChange?: (value: string) => void
}

export default function ProfileHeader({ userId, tagFilter = '', onTagFilterChange }: ProfileHeaderProps) {
  const [userName, setUserName] = useState<string>('')
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [totalInterests, setTotalInterests] = useState(0)
  const [totalPosts, setTotalPosts] = useState(0)
  const [localTagFilter, setLocalTagFilter] = useState(tagFilter)
  const pathname = usePathname()
  const supabase = createClient()

  // Update local tag filter when prop changes
  useEffect(() => {
    setLocalTagFilter(tagFilter)
  }, [tagFilter])

  // Handle tag filter change
  const handleTagFilterChange = (value: string) => {
    setLocalTagFilter(value)
    if (onTagFilterChange) {
      onTagFilterChange(value)
    }
  }

  // Check if current user is the profile owner
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setIsOwner(user.id === userId)
        }
      } catch (error) {
        console.error('Error checking user:', error)
      }
    }

    checkOwnership()
  }, [supabase, userId])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get user profile details
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, cover_image_url, username')
          .eq('id', userId)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }

        if (profile) {
          setUserName(profile.full_name || 'Пользователь')
          setUsername(profile.username)
          if (profile.avatar_url) {
            setAvatarUrl(profile.avatar_url)
          }
          if (profile.cover_image_url) {
            setCoverImageUrl(profile.cover_image_url)
          }
        }

        // Get total interests count
        const { count: interestsCount, error: interestsCountError } = await supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)

        if (!interestsCountError) {
          setTotalInterests(interestsCount || 0)
        }

        // Get total posts count
        const { count: postsCount, error: postsCountError } = await supabase
          .from('posts')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)

        if (!postsCountError) {
          setTotalPosts(postsCount || 0)
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 animate-pulse">Загрузка...</div>
      </div>
    );
  }

  const profileUrl = `/profile/${username || userId}`;
  const isMainProfile = pathname === profileUrl;
  const isPostsPage = pathname?.includes('/posts');
  const isBioPage = pathname?.includes('/bio');

  return (
    <div className="pb-4">
      {/* Full-width container matched to grid sections */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Cover image section */}
        <div className="rounded-lg relative w-full h-64">
          {coverImageUrl ? (
            <SupabaseImage
              src={coverImageUrl}
              alt="Profile Cover"
              className="w-full h-full object-cover rounded-lg"
              priority={true}
              quality={85}
              fallback={
                <div className="rounded-lg w-full h-full bg-gradient-to-r from-[#3d82f7] to-purple-600"></div>
              }
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#3d82f7] to-purple-600 rounded-lg"></div>
          )}

          {/* Centered avatar and username with text shadow */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative w-[130px] h-[130px] rounded-full overflow-hidden bg-white p-1 shadow-lg mb-4">
              {avatarUrl ? (
                <SupabaseImage
                  src={avatarUrl}
                  alt="User Avatar"
                  className="w-full h-full rounded-full object-cover"
                  priority={true}
                  quality={90}
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-indigo-200 text-indigo-600 text-2xl font-bold rounded-full animate-pulse">
                      {userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  }
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-200 text-indigo-600 text-2xl font-bold rounded-full">
                  {userName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <h2 className="font-medium text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{userName}</h2>
          </div>
        </div>

        {/* Navigation and filter section - aligned with grid */}
        <div className="bg-white shadow py-4 px-4 sticky top-16 z-10 rounded-b-lg mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Profile navigation tabs */}
            <div className="pl-0 md:pl-4 flex space-x-6 mb-4 md:mb-0">
              {isOwner ? (
                <>
                  <Link
                    href={profileUrl}
                    className={`text-gray-600 hover:text-[#3d82f7] transition-colors duration-200 font-medium relative group ${isMainProfile ? 'text-gray-800' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      Интересы
                      <span className="text-sm px-1.5 py-0.5 bg-gray-100 rounded-full">
                        {totalInterests}
                      </span>
                    </span>
                    <span className={`absolute -bottom-4 left-0 w-full h-1 bg-[#3d82f7] transform ${isMainProfile ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} transition-transform duration-200`}></span>
                  </Link>
                  <Link
                    href={`${profileUrl}/posts`}
                    className={`text-gray-600 hover:text-[#3d82f7] transition-colors duration-200 font-medium relative group ${isPostsPage ? 'text-gray-800' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      Посты
                      <span className="text-sm px-1.5 py-0.5 bg-gray-100 rounded-full">
                        {totalPosts}
                      </span>
                    </span>
                    <span className={`absolute -bottom-4 left-0 w-full h-1 bg-[#3d82f7] transform ${isPostsPage ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} transition-transform duration-200`}></span>
                  </Link>
                  <Link
                    href={`${profileUrl}/bio`}
                    className={`text-gray-600 hover:text-[#3d82f7] transition-colors duration-200 font-medium relative group ${isBioPage ? 'text-gray-800' : ''}`}
                  >
                    <span>Био</span>
                    <span className={`absolute -bottom-4 left-0 w-full h-1 bg-[#3d82f7] transform ${isBioPage ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} transition-transform duration-200`}></span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={profileUrl}
                    className={`text-gray-600 hover:text-[#3d82f7] transition-colors duration-200 font-medium relative group ${isMainProfile ? 'text-gray-800' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      Интересы
                      <span className="text-sm px-1.5 py-0.5 bg-gray-100 rounded-full">
                        {totalInterests}
                      </span>
                    </span>
                    <span className={`absolute -bottom-4 left-0 w-full h-1 bg-[#3d82f7] transform ${isMainProfile ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} transition-transform duration-200`}></span>
                  </Link>
                  <Link
                    href={`${profileUrl}/posts`}
                    className={`text-gray-600 hover:text-[#3d82f7] transition-colors duration-200 font-medium relative group ${isPostsPage ? 'text-gray-800' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      Посты
                      <span className="text-sm px-1.5 py-0.5 bg-gray-100 rounded-full">
                        {totalPosts}
                      </span>
                    </span>
                    <span className={`absolute -bottom-4 left-0 w-full h-1 bg-[#3d82f7] transform ${isPostsPage ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} transition-transform duration-200`}></span>
                  </Link>
                  <Link
                    href={`${profileUrl}/bio`}
                    className={`text-gray-600 hover:text-[#3d82f7] transition-colors duration-200 font-medium relative group ${isBioPage ? 'text-gray-800' : ''}`}
                  >
                    <span>Био</span>
                    <span className={`absolute -bottom-4 left-0 w-full h-1 bg-[#3d82f7] transform ${isBioPage ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} transition-transform duration-200`}></span>
                  </Link>
                </>
              )}
            </div>

            {/* Only show search in the interests page */}
            {isMainProfile && onTagFilterChange && (
              <div className="w-full md:w-64">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm group-focus-within:text-[#3d82f7] transition-colors duration-200">#</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Фильтровать по тегу..."
                    value={localTagFilter}
                    onChange={(e) => handleTagFilterChange(e.target.value)}
                    className="block w-full pl-8 pr-12 py-2 border border-gray-300 rounded-full shadow-sm focus:border-[#3d82f7] text-black transition-all duration-200 ease-in-out hover:border-indigo-300"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    {localTagFilter ? (
                      <button
                        onClick={() => handleTagFilterChange('')}
                        className="pr-8 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <span className="text-xl">&times;</span>
                      </button>
                    ) : null}
                    <div className="pr-3 text-gray-400">
                      <Search size={18} className="mr-1" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}