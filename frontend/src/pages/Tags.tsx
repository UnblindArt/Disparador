import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Tag as TagIcon, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { tagsAPI } from '../services/api'

interface Tag {
  id: string
  name: string
  color: string
  description?: string
  created_at?: string
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#14B8A6', // Teal
]

export default function Tags() {
  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0],
    description: '',
  })
  const queryClient = useQueryClient()

  // Fetch tags
  const { data: tagsResponse, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await tagsAPI.getTags()
      return res.data
    },
  })

  const tags = tagsResponse?.data || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string; description?: string }) =>
      tagsAPI.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag criada com sucesso!')
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar tag')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      tagsAPI.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag atualizada com sucesso!')
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar tag')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => tagsAPI.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag deletada com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao deletar tag')
    },
  })

  const resetForm = () => {
    setFormData({ name: '', color: PRESET_COLORS[0], description: '' })
    setEditingTag(null)
    setShowForm(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Nome da tag é obrigatório')
      return
    }

    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta tag?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tags</h1>
          <p className="text-clinic-gray-300">
            Organize seus pacientes com etiquetas personalizadas
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
              Nova Tag
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">
              {editingTag ? 'Editar Tag' : 'Nova Tag'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nome da Tag"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cliente VIP, Follow-up, Urgente..."
                className="bg-white/20 text-white placeholder:text-clinic-gray-400"
                required
              />

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Cor da Tag
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
                  placeholder="Descreva o propósito desta tag..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white/20 text-white placeholder:text-clinic-gray-400 border border-clinic-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-royal"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-clinic-royal hover:bg-clinic-royal/80">
                  {editingTag ? 'Atualizar' : 'Criar Tag'}
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
            <TagIcon size={20} />
            Suas Tags ({tags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-clinic-gray-400">
              Carregando tags...
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon size={48} className="mx-auto mb-4 text-clinic-gray-600" />
              <p className="text-clinic-gray-400 mb-2">Nenhuma tag criada ainda</p>
              <p className="text-sm text-clinic-gray-500">
                Crie tags para organizar melhor seus pacientes
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag: Tag) => (
                <div
                  key={tag.id}
                  className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all group border border-white/10 hover:border-white/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <h3 className="font-medium text-white truncate">{tag.name}</h3>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(tag)}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} className="text-clinic-gray-300 hover:text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                        title="Deletar"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  {tag.description && (
                    <p className="text-sm text-clinic-gray-400 line-clamp-2">
                      {tag.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
