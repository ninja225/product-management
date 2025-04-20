'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase'
import { Database } from '@/types/database'
import SupabaseImage from '../ui/SupabaseImage'
import ConfirmationDialog from '../ui/ConfirmationDialog'

type Product = Database['public']['Tables']['products']['Row']

interface ProductCardProps {
  product: Product
  onDelete: (id: string) => void
  onEdit: (product: Product) => void
  onTagClick?: (tag: string) => void
}

// Define a constant for the default tag to ensure consistency
export const DEFAULT_TAG = 'разное'

// Define maximum description length before truncating
const MAX_DESCRIPTION_LENGTH = 50

export default function ProductCard({ product, onDelete, onEdit, onTagClick }: ProductCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const supabase = createClient()
  
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  }
  
  const handleDeleteConfirm = async () => {
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
      setShowDeleteConfirm(false)
    }
  }

  // Helper function to get the actual tag value (either the product tag or the default)
  const getDisplayTag = () => product.tag || DEFAULT_TAG

  const handleTagClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTagClick) {
      onTagClick(getDisplayTag());
    }
  };

  // Helper function to handle description text and truncation
  const description = product.description || 'Нет описания'
  const isDescriptionLong = description.length > MAX_DESCRIPTION_LENGTH

  // Get product title for confirmation dialog
  const productTitle = product.title || description.substring(0, 30)

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex flex-row">
        {/* Left side - Image */}
        <div className="flex items-center justify-center p-2 w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] flex-shrink-0">
          <div className="relative w-full h-full border border-gray-200 rounded-md overflow-hidden bg-white flex items-center justify-center">
            {product.image_url ? (
              <SupabaseImage 
                src={product.image_url} 
                alt={product.title || description.substring(0, 30) || 'Изображение продукта'} 
                className="max-w-full max-h-full object-contain p-1"
                fill={false}
                width={130}
                height={130}
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">Ошибка загрузки</p>
                  </div>
                }
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Нет изображения</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Content with reorganized structure */}
        <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
          {/* Title at the top */}
          {product.title && (
            <h3 className="font-medium text-gray-800 text-sm sm:text-base mb-1 break-words">
              {product.title}
            </h3>
          )}
          
          {/* Description */}
          <div className="mb-3 flex-grow">
            <p className={`text-gray-700 text-sm sm:text-base break-words ${!showFullDescription ? 'truncate' : ''}`}>
              {description}
            </p>
            
            {/* Show more/less button - now under the description */}
            {isDescriptionLong && (
              <button 
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 mt-1"
              >
                {showFullDescription ? 'Показать меньше' : 'Показать больше'}
              </button>
            )}
          </div>
          
          {/* Tag and date at the bottom */}
          <div className="flex justify-between items-center py-2 border-t border-gray-100">
            <button
              onClick={handleTagClick}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none"
            >
              #{getDisplayTag()}
            </button>
            <div className="text-xs text-gray-500">
              {new Date(product.created_at).toLocaleDateString()}
            </div>
          </div>
          
          {/* Action buttons at the very bottom */}
          <div className="flex justify-between gap-2 pt-2 w-full">
            <button
              onClick={() => onEdit(product)}
              className="px-2 py-1 text-xs sm:text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 whitespace-nowrap"
            >
              Редактировать
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="px-2 py-1 text-xs sm:text-sm text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50 whitespace-nowrap"
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Удалить продукт"
        message={`Вы уверены, что хотите удалить продукт "${productTitle}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        isLoading={isDeleting}
      />
    </div>
  )
}