'use client'

import { useState } from 'react'
import Image from 'next/image'

interface SupabaseImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  fallback?: React.ReactNode
}

/**
 * Custom image component for Supabase storage images that handles errors
 * by providing fallbacks and bypasses Next.js optimization for Supabase URLs.
 */
export default function SupabaseImage({ 
  src, 
  alt, 
  width, 
  height, 
  fill = false, 
  className = '',
  fallback
}: SupabaseImageProps) {
  const [error, setError] = useState(false)
  const isDataUrl = src?.startsWith('data:')
  
  // If image fails to load or there's no src, show the fallback
  if (error || !src) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {fallback || <div className="text-gray-400">No image</div>}
      </div>
    )
  }
  
  // For data URLs (like local previews), use Next.js Image
  if (isDataUrl) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={className}
        onError={() => setError(true)}
      />
    )
  }
  
  // For Supabase URLs, use a regular img tag to avoid Next.js optimization issues
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      style={fill ? { objectFit: 'cover', position: 'absolute', width: '100%', height: '100%' } : {}}
    />
  )
}