import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Package, X, DollarSign } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { productsAPI, type Product } from '../services/api'

const PRESET_COLORS = [
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#14B8A6', // Teal
]

const CATEGORIES = [
  'Procedimento',
  'Consulta',
  'Produto',
  'Pacote',
  'Retorno',
  'Avaliação',
  'Outro',
]

export default function Products() {
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sku: '',
    category: '',
    color: PRESET_COLORS[0],
  })
  const queryClient = useQueryClient()

  // Fetch products
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productsAPI.getProducts()
      return res.data
    },
  })

  const products = productsResponse?.data || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => productsAPI.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto criado com sucesso!')
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar produto')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productsAPI.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto atualizado com sucesso!')
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar produto')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsAPI.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produto deletado com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao deletar produto')
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      sku: '',
      category: '',
      color: PRESET_COLORS[0],
    })
    setEditingProduct(null)
    setShowForm(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Nome do produto é obrigatório')
      return
    }

    const submitData = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : undefined,
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price?.toString() || '',
      sku: product.sku || '',
      category: product.category || '',
      color: '#10B981', // default color
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
      deleteMutation.mutate(id)
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Produtos & Serviços</h1>
          <p className="text-clinic-gray-300">
            Gerencie procedimentos, consultas e produtos oferecidos
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-clinic-royal hover:bg-clinic-royal/80"
        >
          {showForm ? (
            <>
              <X size={18} className="mr-2" />
              Cancelar
            </>
          ) : (
            <>
              <Plus size={18} className="mr-2" />
              Novo Produto
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Produto/Serviço"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Rinoplastia, Botox, Consulta..."
                  className="bg-white/20 text-white placeholder:text-clinic-gray-400"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-white/20 text-white border border-clinic-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-royal"
                  >
                    <option value="" className="bg-clinic-black">Selecione...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-clinic-black">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Preço (R$)"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="bg-white/20 text-white placeholder:text-clinic-gray-400"
                />

                <Input
                  label="SKU / Código"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ex: RINO-001"
                  className="bg-white/20 text-white placeholder:text-clinic-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Cor de Identificação
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-full transition-all ${
                        formData.color === color
                          ? 'ring-4 ring-white ring-offset-2 ring-offset-clinic-black scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o produto ou procedimento..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white/20 text-white placeholder:text-clinic-gray-400 border border-clinic-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-royal"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-clinic-royal hover:bg-clinic-royal/80">
                  {editingProduct ? 'Atualizar' : 'Criar Produto'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border-clinic-gray-600 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-none bg-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package size={20} />
            Seus Produtos & Serviços ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-clinic-gray-400">
              Carregando produtos...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto mb-4 text-clinic-gray-600" />
              <p className="text-clinic-gray-400 mb-2">Nenhum produto cadastrado ainda</p>
              <p className="text-sm text-clinic-gray-500">
                Cadastre seus procedimentos e serviços para vincular aos pacientes
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product: Product) => (
                <div
                  key={product.id}
                  className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all group border border-white/10 hover:border-white/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Package className="w-4 h-4 flex-shrink-0 text-green-600" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{product.name}</h3>
                        {product.category && (
                          <span className="text-xs text-clinic-gray-400">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} className="text-clinic-gray-300 hover:text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                        title="Deletar"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {product.price && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={14} className="text-green-400" />
                        <span className="text-green-300 font-semibold">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    )}

                    {product.sku && (
                      <p className="text-xs text-clinic-gray-400">SKU: {product.sku}</p>
                    )}

                    {product.description && (
                      <p className="text-sm text-clinic-gray-400 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
