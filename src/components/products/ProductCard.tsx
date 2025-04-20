'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'
import { Database } from '@/types/database'
import SupabaseImage from '../ui/SupabaseImage'
import ConfirmationDialog from '../ui/ConfirmationDialog'
import { Edit, Trash2, Tag } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row']

interface ProductCardProps {
  product: Product
  onDelete: (id: string) => void
  onEdit: (product: Product) => void
  onTagClick?: (tag: string) => void
}

export const DEFAULT_TAG = 'разное'
const MAX_DESCRIPTION_LENGTH = 50

export default function ProductCard({ product, onDelete, onEdit, onTagClick }: ProductCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const supabase = createClient()
  
  useEffect(() => {
    if (product.image_url) {
      const img = new Image();
      img.src = product.image_url;
      img.onload = () => setIsImageLoaded(true);
    }
  }, [product.image_url]);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  }
  
  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      if (product.image_url) {
        const imagePath = new URL(product.image_url).pathname.split('/').pop()
        if (imagePath) {
          await supabase.storage.from('product_images').remove([imagePath])
        }
      }
      
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

  const getDisplayTag = () => product.tag || DEFAULT_TAG

  const handleTagClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTagClick) {
      onTagClick(getDisplayTag());
    }
  };

  const description = product.description || 'Нет описания'
  const isDescriptionLong = description.length > MAX_DESCRIPTION_LENGTH
  const productTitle = product.title || description.substring(0, 30)

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl hover:border-indigo-200 group">
      <div className="flex flex-row">
        {/* Left side - Image */}
        <div className="flex items-center justify-center p-2 w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] md:w-[150px] md:h-[150px] flex-shrink-0">
          <div className="relative w-full h-full border border-gray-200 rounded-md overflow-hidden bg-white flex items-center justify-center group-hover:border-indigo-200 transition-colors duration-300">
            {product.image_url ? (
              <SupabaseImage 
                src={product.image_url} 
                alt={product.title || description.substring(0, 30) || 'Изображение продукта'} 
                className={`max-w-full max-h-full object-contain p-1 transition-all duration-500 ${
                  isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                } group-hover:scale-105`}
                fill={false}
                width={130}
                height={130}
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse">
                    <p className="text-gray-500 text-xs sm:text-sm">Ошибка загрузки</p>
                  </div>
                }
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 transition-colors duration-300 group-hover:bg-gray-50">
                <p className="text-gray-500 text-xs sm:text-sm group-hover:text-indigo-500 transition-colors duration-300">Нет изображения</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Content */}
        <div className="p-2 sm:p-3 md:p-4 flex-1 flex flex-col justify-between min-w-0">
          {/* Title */}
          {product.title && (
            <h3 className="font-medium text-gray-800 text-xs sm:text-sm md:text-base mb-1 break-words line-clamp-2">
              {product.title}
            </h3>
          )}
          
          {/* Description */}
          <div className="mb-2 sm:mb-3 flex-grow">
            <p className={`text-gray-700 text-xs sm:text-sm md:text-base break-words transition-all duration-300 ${
              !showFullDescription ? 'line-clamp-2 sm:line-clamp-2' : ''
            } group-hover:text-gray-900`}>
              {description}
            </p>
            
            {isDescriptionLong && (
              <button 
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-800 mt-1 transition-all duration-200 hover:underline focus:outline-none"
              >
                {showFullDescription ? 'Показать меньше' : 'Показать больше'}
              </button>
            )}
          </div>
          
          {/* Tag and date */}
          <div className="flex justify-between items-center py-1 sm:py-2 border-t border-gray-100 group-hover:border-indigo-50 transition-colors duration-300">
            <button
              onClick={handleTagClick}
              className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none transition-all duration-200 transform hover:translate-x-1 flex items-center gap-1"
            >
              <Tag size={12} />
              <span className="md:inline">{`#${getDisplayTag()}`}</span>
            </button>
            <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
              {new Date(product.created_at).toLocaleDateString()}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between gap-2 pt-2 w-full">
            <button
              onClick={() => onEdit(product)}
              title="Редактировать"
              aria-label="Редактировать"
              className="cursor-pointer px-2 py-1 text-xs sm:text-sm text-indigo-600 border border-indigo-600 rounded-md transition-all duration-200 hover:bg-indigo-50 whitespace-nowrap focus:outline-none flex items-center gap-1"
            >
              <Edit size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline">Редактировать</span>
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              title="Удалить"
              aria-label="Удалить"
              className="cursor-pointer px-2 py-1 text-xs sm:text-sm text-white bg-red-500 rounded-md transition-all duration-200 hover:bg-red-600 disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
            >
              <Trash2 size={16} className="flex-shrink-0" />
              <span className="hidden sm:inline">{isDeleting ? 'Удаление...' : 'Удалить'}</span>
              {isDeleting && <span className="sm:hidden">...</span>}
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