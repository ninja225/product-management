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

export default function ProductCard({ product, onDelete, onEdit }: ProductCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48">
        <SupabaseImage 
          src={product.image_url || ''} 
          alt={product.description || 'Изображение продукта'} 
          fill
          className="w-full h-full object-cover"
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <p className="text-gray-500">Нет изображения</p>
            </div>
          }
        />
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm font-medium text-indigo-600">
            {/* Use getDisplayTag for consistent tag handling */}
            #{getDisplayTag()}
          </div>
          <div className="text-xs text-black">
            {new Date(product.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <p className="text-gray-700 mb-4">{product.description || 'Нет описания'}</p>
        
        <div className="flex justify-between">
          <button
            onClick={() => onEdit(product)}
            className="px-3 py-1 text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50"
          >
            Редактировать
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  )
}