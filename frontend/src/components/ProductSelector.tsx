import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Package, Check, DollarSign } from 'lucide-react'
import { productsAPI, contactsAPI, type Product } from '../services/api'
import Button from './ui/Button'

interface ProductSelectorProps {
  contactId: string
  contactName: string
  currentProductIds: string[]
  onClose: () => void
}

export default function ProductSelector({
  contactId,
  contactName,
  currentProductIds,
  onClose,
}: ProductSelectorProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(currentProductIds || [])
  const queryClient = useQueryClient()

  useEffect(() => {
    setSelectedProducts(currentProductIds || [])
  }, [currentProductIds])

  // Fetch all products
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productsAPI.getProducts()
      return res.data
    },
  })

  const products: Product[] = productsResponse?.data || []

  // Add products mutation
  const addProductsMutation = useMutation({
    mutationFn: () => contactsAPI.addProductsToContact(contactId, selectedProducts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Produtos atualizados com sucesso!')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar produtos')
    },
  })

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const handleSave = () => {
    addProductsMutation.mutate()
  }

  const formatPrice = (price?: number) => {
    if (!price) return null
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-clinic-black border border-clinic-royal/20 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-clinic-royal/20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package size={24} />
              Gerenciar Produtos & Serviços
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-clinic-gray-400" />
            </button>
          </div>
          <p className="text-clinic-gray-400">
            Selecione os procedimentos para{' '}
            <span className="text-white font-medium">{contactName}</span>
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-8 text-clinic-gray-400">Carregando produtos...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto mb-4 text-clinic-gray-600" />
              <p className="text-clinic-gray-400 mb-2">Nenhum produto disponível</p>
              <p className="text-sm text-clinic-gray-500">
                Cadastre produtos primeiro na página de Produtos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map((product) => {
                const isSelected = selectedProducts.includes(product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-clinic-royal bg-clinic-royal/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Package className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-white block truncate">
                            {product.name}
                          </span>
                          {product.category && (
                            <span className="text-xs text-clinic-gray-400">
                              {product.category}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={18} className="text-clinic-royal flex-shrink-0" />
                      )}
                    </div>

                    {product.price && (
                      <div className="flex items-center gap-1 text-sm text-green-300 mb-1">
                        <DollarSign size={14} />
                        <span className="font-semibold">{formatPrice(product.price)}</span>
                      </div>
                    )}

                    {product.description && (
                      <p className="text-sm text-clinic-gray-400 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-clinic-royal/20 flex gap-3">
          <Button
            onClick={handleSave}
            disabled={addProductsMutation.isPending || products.length === 0}
            className="flex-1 bg-clinic-royal hover:bg-clinic-royal/80"
          >
            {addProductsMutation.isPending
              ? 'Salvando...'
              : `Salvar (${selectedProducts.length} selecionados)`}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="border-clinic-gray-600 text-white hover:bg-white/10"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
