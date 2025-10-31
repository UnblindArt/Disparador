import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Tag as TagIcon, Package, Settings } from 'lucide-react'
import { tagsAPI, productsAPI, type Tag, type Product } from '../services/api'
import TagsManager from './TagsManager'
import ProductsManager from './ProductsManager'

interface ContactTagsProductsProps {
  contactId: string
  contactPhone?: string
}

export default function ContactTagsProducts({ contactId }: ContactTagsProductsProps) {
  const queryClient = useQueryClient()
  const [showTagsManager, setShowTagsManager] = useState(false)
  const [showProductsManager, setShowProductsManager] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  // Get all tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await tagsAPI.getAll()
      return res.data.data
    }
  })

  // Get all products
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productsAPI.getAll()
      return res.data.data
    }
  })

  // Get contact's tags and products
  const { data: contactData } = useQuery({
    queryKey: ['contact-details', contactId],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch contact')
      const data = await res.json()
      return data.data
    },
    enabled: !!contactId
  })

  // Initialize selected tags and products from contact data
  useEffect(() => {
    if (contactData) {
      // Extract tag IDs from contact_tags relationship
      const tagIds = contactData.tags?.map((t: any) => t.tag_id) || []
      setSelectedTags(tagIds)

      // Extract product IDs from contact_products relationship
      const productIds = contactData.products?.map((p: any) => p.product_id) || []
      setSelectedProducts(productIds)
    }
  }, [contactData])

  // Add tag to contact
  const addTagMutation = useMutation({
    mutationFn: (tagId: string) => tagsAPI.addToContact(tagId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags', contactId] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Tag adicionada ao contato!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao adicionar tag')
    }
  })

  // Remove tag from contact
  const removeTagMutation = useMutation({
    mutationFn: (tagId: string) => tagsAPI.removeFromContact(tagId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags', contactId] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Tag removida do contato!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover tag')
    }
  })

  // Add product to contact
  const addProductMutation = useMutation({
    mutationFn: ({ productId, notes }: { productId: string; notes?: string }) =>
      productsAPI.addToContact(productId, contactId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-products', contactId] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Produto adicionado ao contato!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao adicionar produto')
    }
  })

  // Remove product from contact
  const removeProductMutation = useMutation({
    mutationFn: (productId: string) => productsAPI.removeFromContact(productId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-products', contactId] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Produto removido do contato!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover produto')
    }
  })

  const handleAddTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      return
    }
    setSelectedTags([...selectedTags, tagId])
    addTagMutation.mutate(tagId)
  }

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(id => id !== tagId))
    removeTagMutation.mutate(tagId)
  }

  const handleAddProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      return
    }
    setSelectedProducts([...selectedProducts, productId])
    addProductMutation.mutate({ productId })
  }

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(id => id !== productId))
    removeProductMutation.mutate(productId)
  }

  const availableTags = tagsData?.filter((tag: Tag) => !selectedTags.includes(tag.id)) || []
  const availableProducts = productsData?.filter((p: Product) => !selectedProducts.includes(p.id)) || []

  return (
    <div className="space-y-6">
      {/* Tags Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Tags</h3>
          </div>
          <button
            onClick={() => setShowTagsManager(true)}
            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Gerenciar tags"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedTags.map((tagId) => {
              const tag = tagsData?.find((t: Tag) => t.id === tagId)
              if (!tag) return null
              return (
                <div
                  key={tag.id}
                  className="flex items-center gap-1 px-2 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  <span>{tag.name}</span>
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="hover:bg-black/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Tag Select */}
        {availableTags.length > 0 ? (
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddTag(e.target.value)
                  e.target.value = ''
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="">+ Adicionar tag...</option>
              {availableTags.map((tag: Tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        ) : selectedTags.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma tag disponível.{' '}
            <button
              onClick={() => setShowTagsManager(true)}
              className="text-green-600 hover:underline"
            >
              Criar primeira tag
            </button>
          </p>
        ) : null}
      </div>

      {/* Products Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Produtos/Serviços</h3>
          </div>
          <button
            onClick={() => setShowProductsManager(true)}
            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Gerenciar produtos"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div className="space-y-2 mb-3">
            {selectedProducts.map((productId) => {
              const product = productsData?.find((p: Product) => p.id === productId)
              if (!product) return null
              return (
                <div
                  key={product.id}
                  className="flex items-start justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{product.name}</p>
                    {product.price && (
                      <p className="text-xs text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(product.price)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(product.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Product Select */}
        {availableProducts.length > 0 ? (
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddProduct(e.target.value)
                  e.target.value = ''
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="">+ Adicionar produto/serviço...</option>
              {availableProducts.map((product: Product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                  {product.price && ` - ${new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(product.price)}`}
                </option>
              ))}
            </select>
          </div>
        ) : selectedProducts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum produto disponível.{' '}
            <button
              onClick={() => setShowProductsManager(true)}
              className="text-green-600 hover:underline"
            >
              Criar primeiro produto
            </button>
          </p>
        ) : null}
      </div>

      {/* Modals */}
      {showTagsManager && <TagsManager onClose={() => setShowTagsManager(false)} />}
      {showProductsManager && <ProductsManager onClose={() => setShowProductsManager(false)} />}
    </div>
  )
}
