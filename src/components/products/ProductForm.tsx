'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'
import { Database } from '@/types/database'
import { v4 as uuidv4 } from 'uuid'
import SupabaseImage from '../ui/SupabaseImage'
import { Save, X } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']

interface ProductFormProps {
  userId: string
  product?: Product
  section: 'left' | 'right'
  onComplete: () => void
  onCancel: () => void
}

export default function ProductForm({ userId, product, section, onComplete, onCancel }: ProductFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tag, setTag] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  const isEditing = !!product
  
  useEffect(() => {
    if (product) {
      setTitle(product.title || '')
      setDescription(product.description || '')
      setTag(product.tag || '')
      if (product.image_url) {
        setImagePreview(product.image_url)
      }
    }
  }, [product])
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      let imageUrl = product?.image_url || null
      
      // Handle image upload if there's a new image
      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `${userId}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('product_images')
          .upload(filePath, image)
          
        if (uploadError) {
          throw new Error(`Error uploading image: ${uploadError.message}`)
        }
        
        const { data } = supabase.storage.from('product_images').getPublicUrl(filePath)
        imageUrl = data.publicUrl
        
        // Delete old image if updating and there was a previous image
        if (isEditing && product?.image_url) {
          const oldImagePath = new URL(product.image_url).pathname.split('/').pop()
          if (oldImagePath) {
            await supabase.storage.from('product_images').remove([`${userId}/${oldImagePath}`])
          }
        }
      }
      
      const productData: ProductInsert = {
        user_id: userId,
        title,
        description,
        tag,
        image_url: imageUrl,
        display_section: section
      }
      
      if (isEditing) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          
        if (updateError) throw new Error(`Error updating product: ${updateError.message}`)
      } else {
        // Insert new product
        const { error: insertError } = await supabase
          .from('products')
          .insert(productData)
          
        if (insertError) throw new Error(`Error creating product: ${insertError.message}`)
      }
      
      onComplete()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      console.error('Error saving product:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-black">
        {isEditing ? 'Изменить продукт' : 'Добавить новый продукт'}
      </h2>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="product-image" className="block text-sm font-medium text-gray-700 mb-1">
            Изображение продукта
          </label>
          {imagePreview && (
            <div className="relative h-48 mb-2 border rounded-md overflow-hidden">
              <SupabaseImage
                src={imagePreview}
                alt="Product preview"
                fill
                className="object-contain"
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <p className="text-gray-500">Предварительный просмотр недоступен</p>
                  </div>
                }
              />
            </div>
          )}
          <input
            id="product-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            aria-label="Выберите изображение продукта"
            className="cursor-pointer w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-black mb-1">
            названия
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Введите названия продукта"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-black mb-1">
            Описание
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            // required
            rows={3}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Опишите ваш продукт"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="tag" className="block text-sm font-medium text-black mb-1">
            теги
          </label>
          <input
            id="tag"
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Добавить тег (необязательно)"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center space-x-2"
          >
            <X size={16} />
            <span>Отмена</span>
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center space-x-2"
          >
            <Save size={16} />
            <span>{isLoading ? 'Сохранение...' : isEditing ? 'Обновить продукт' : 'Добавить продукт'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}