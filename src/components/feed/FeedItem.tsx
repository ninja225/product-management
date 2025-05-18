'use client'

import Link from 'next/link'
import { Database } from '@/types/database'
import SupabaseImage from '@/components/ui/SupabaseImage'
import { User, ThumbsUp, ThumbsDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

type FeedProduct = Database['public']['Tables']['products']['Row'] & {
    profiles: {
        id: string
        full_name: string | null
        avatar_url: string | null
        username: string | null
    }
}

interface FeedItemProps {
    product: FeedProduct
}

export default function FeedItem({ product }: FeedItemProps) {
    const {
        title,
        description,
        image_url,
        tag,
        created_at,
        display_section,
        profiles
    } = product

    const formattedDate = formatDistanceToNow(new Date(created_at), {
        addSuffix: true,
        locale: ru
    })

    const profile = profiles
    const profileUrl = profile?.username
        ? `/profile/${profile.username}`
        : `/profile/${profile?.id}`

    const displayName = profile?.full_name || profile?.username || 'Пользователь'

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg">
            {/* Top colored border based on the display section (like/dislike) */}
            <div className={`h-1 w-full ${display_section === 'left' ? 'bg-green-500' : 'bg-red-500'}`}></div>

            <div className="p-4">
                {/* User info section */}
                <div className="flex items-center mb-4">
                    <Link href={profileUrl} className="flex items-center group">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mr-3 border border-gray-200">
                            {profile?.avatar_url ? (
                                <SupabaseImage
                                    src={profile.avatar_url}
                                    alt={displayName}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <User className="h-6 w-6 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <div className="font-medium text-gray-800 group-hover:text-[#3d82f7] transition-colors">
                                {displayName}
                            </div>
                            <div className="text-xs text-gray-500">{formattedDate}</div>
                        </div>
                    </Link>

                    <div className="ml-auto flex items-center">
                        {display_section === 'left' ? (
                            <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                <ThumbsUp className="w-3 h-3" />
                                <span>Нравится</span>
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                <ThumbsDown className="w-3 h-3" />
                                <span>Не нравится</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Content section */}
                <div>
                    {/* Title */}
                    <h3 className="text-gray-700 font-semibold text-lg mb-2">{title || 'Без названия'}</h3>

                    {/* Image if available */}
                    {image_url && (
                        <div className="mb-3 rounded-md overflow-hidden">
                            <SupabaseImage
                                src={image_url}
                                alt={title || 'Product Image'}
                                width={600}
                                height={400}
                                className="w-full h-auto object-cover max-h-80"
                            />
                        </div>
                    )}                    {/* Description */}
                    {description && (
                        <div className="text-gray-700 mb-3 whitespace-pre-line break-words">
                            {description}
                        </div>
                    )}

                    {/* Tags */}
                    {tag && (
                        <div className="mt-2">
                            <span className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                                #{tag}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
