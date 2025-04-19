'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'
import ProductCard, { DEFAULT_TAG } from '@/components/products/ProductCard'
import ProductForm from '@/components/products/ProductForm'
import { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [leftProducts, setLeftProducts] = useState<Product[]>([])
  const [rightProducts, setRightProducts] = useState<Product[]>([])
  const [filteredLeftProducts, setFilteredLeftProducts] = useState<Product[]>([])
  const [filteredRightProducts, setFilteredRightProducts] = useState<Product[]>([])
  const [tagFilter, setTagFilter] = useState('')
  const [showLeftForm, setShowLeftForm] = useState(false)
  const [showRightForm, setShowRightForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserAndProducts = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        // Fetch products for the user
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Separate products into left and right displays
        if (products) {
          const leftProds = products.filter(p => p.display_section === 'left')
          const rightProds = products.filter(p => p.display_section === 'right')
          setLeftProducts(leftProds)
          setRightProducts(rightProds)
          setFilteredLeftProducts(leftProds)
          setFilteredRightProducts(rightProds)
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndProducts()
  }, [supabase])

  // Apply tag filtering
  useEffect(() => {
    if (tagFilter.trim() === '') {
      setFilteredLeftProducts(leftProducts)
      setFilteredRightProducts(rightProducts)
    } else {
      const normalizedFilter = tagFilter.toLowerCase().trim()
      // Check if the filter matches the default tag
      const isDefaultTagSearch = DEFAULT_TAG.toLowerCase().includes(normalizedFilter)
      
      setFilteredLeftProducts(leftProducts.filter(p => 
        p.tag?.toLowerCase().includes(normalizedFilter) || 
        // Include products with null/empty tags if searching for default tag
        (isDefaultTagSearch && (!p.tag || p.tag.trim() === ''))
      ))
      setFilteredRightProducts(rightProducts.filter(p => 
        p.tag?.toLowerCase().includes(normalizedFilter) || 
        // Include products with null/empty tags if searching for default tag
        (isDefaultTagSearch && (!p.tag || p.tag.trim() === ''))
      ))
    }
  }, [tagFilter, leftProducts, rightProducts])

  const handleDeleteProduct = (productId: string) => {
    setLeftProducts(prev => prev.filter(p => p.id !== productId))
    setRightProducts(prev => prev.filter(p => p.id !== productId))
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    if (product.display_section === 'left') {
      setShowLeftForm(true)
    } else {
      setShowRightForm(true)
    }
  }

  const handleFormComplete = async () => {
    // Refresh products after form submission
    if (userId) {
      setIsLoading(true)
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (products) {
          const leftProds = products.filter(p => p.display_section === 'left')
          const rightProds = products.filter(p => p.display_section === 'right')
          setLeftProducts(leftProds)
          setRightProducts(rightProds)
          setFilteredLeftProducts(leftProds)
          setFilteredRightProducts(rightProds)
        }
      } catch (error) {
        console.error('Error refreshing products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Reset form states
    setShowLeftForm(false)
    setShowRightForm(false)
    setEditingProduct(undefined)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="pb-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Панель управления вашими продуктами</h1>
      
      {/* Tag filter */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">#</span>
          </div>
          <input
            type="text"
            placeholder="Фильтровать по тегу..."
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="block w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
          />
        </div>
      </div>

      {/* Sections container - with vertical separator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* Left Display Section */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Левый дисплей</h2>
            <button
              onClick={() => {
                setEditingProduct(undefined)
                setShowLeftForm(true)
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Добавить продукт
            </button>
          </div>

          {showLeftForm && userId && (
            <div className="mb-6">
              <ProductForm
                userId={userId}
                product={editingProduct?.display_section === 'left' ? editingProduct : undefined}
                section="left"
                onComplete={handleFormComplete}
                onCancel={() => {
                  setShowLeftForm(false)
                  setEditingProduct(undefined)
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeftProducts.length > 0 ? (
              filteredLeftProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDeleteProduct}
                  onEdit={handleEditProduct}
                />
              ))
            ) : (
              <div className="col-span-full py-10 text-center text-gray-500">
                {tagFilter ? 'Ни один продукт не соответствует вашему фильтру.' : 'Нет продуктов в левом дисплее. Добавьте свой первый продукт!'}
              </div>
            )}
          </div>
        </section>

        {/* Vertical separator line */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-black transform -translate-x-1/2"></div>

        {/* Right Display Section */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Правый дисплей</h2>
            <button
              onClick={() => {
                setEditingProduct(undefined)
                setShowRightForm(true)
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Добавить продукт
            </button>
          </div>

          {showRightForm && userId && (
            <div className="mb-6">
              <ProductForm
                userId={userId}
                product={editingProduct?.display_section === 'right' ? editingProduct : undefined}
                section="right"
                onComplete={handleFormComplete}
                onCancel={() => {
                  setShowRightForm(false)
                  setEditingProduct(undefined)
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRightProducts.length > 0 ? (
              filteredRightProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDeleteProduct}
                  onEdit={handleEditProduct}
                />
              ))
            ) : (
              <div className="col-span-full py-10 text-center text-gray-500">
                {tagFilter ? 'Ни один продукт не соответствует вашему фильтру.' : 'Нет товаров в Right Display. Добавьте свой первый товар!'}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}