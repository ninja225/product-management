'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase'
import { Database } from '@/types/database'
import SupabaseImage from '../ui/SupabaseImage'

type Product = Database['public']['Tables']['products']['Row']

interface ProductCardProps {
  product: Product
  onDelete: (id: string) => void
  onEdit: (product: Product) => void
}

// Define a constant for the default tag to ensure consistency
export const DEFAULT_TAG = 'разное'

// Define maximum description length before truncating
const MAX_DESCRIPTION_LENGTH = 50

export default function ProductCard({ product, onDelete, onEdit }: ProductCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const supabase = createClient()
  
  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот продукт?')) return
    
    setIsDeleting(true)
    try {
      // Delete product image from storage if exists
      if (product.image_url) {
        const imagePath = new URL(product.image_url).pathname.split('/').pop()
        if (imagePath) {
          await supabase.storage.from('product_images').remove([imagePath])
        }
      }
      
      // Delete product from database
      await supabase
        .from('products')
        .delete()
        .eq('id', product.id)
      
      onDelete(product.id)
    } catch (error) {
      console.error('Error deleting product:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper function to get the actual tag value (either the product tag or the default)
  const getDisplayTag = () => product.tag || DEFAULT_TAG

  // Helper function to handle description text and truncation
  const description = product.description || 'Нет описания'
  const isDescriptionLong = description.length > MAX_DESCRIPTION_LENGTH

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex flex-row">
        {/* Left side - Image */}
        <div className="relative h-32 min-h-[8rem] w-1/3 min-w-[120px]">
          <SupabaseImage 
            src={product.image_url || ''} 
            alt={product.description || 'Изображение продукта'} 
            fill
            className="object-cover"
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <p className="text-gray-500">Нет изображения</p>
              </div>
            }
          />
        </div>
        
        {/* Right side - Content */}
        <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
          {/* Top: Tag and date */}
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-medium text-indigo-600">
              #{getDisplayTag()}
            </div>
            <div className="text-xs text-black">
              {new Date(product.created_at).toLocaleDateString()}
            </div>
          </div>
          
          {/* Middle: Description - single line with ellipsis when not expanded */}
          <div className="mb-2 flex-grow">
            <p className={`text-gray-700 text-sm sm:text-base break-words ${!showFullDescription ? 'truncate' : ''}`}>
              {description}
            </p>
            
            {/* Show more/less button */}
            {isDescriptionLong && (
              <button 
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 mt-1 block"
              >
                {showFullDescription ? 'Показать меньше' : 'Показать больше'}
              </button>
            )}
          </div>
          
          {/* Bottom: Action buttons - fixed at bottom */}
          <div className="flex justify-between gap-2 pt-2 border-t border-gray-100 w-full">
            <button
              onClick={() => onEdit(product)}
              className="px-2 py-1 text-xs sm:text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 whitespace-nowrap"
            >
              Редактировать
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-2 py-1 text-xs sm:text-sm text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50 whitespace-nowrap"
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}