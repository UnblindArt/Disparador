import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Tag as TagIcon, Check } from 'lucide-react'
import { tagsAPI, contactsAPI } from '../services/api'
import Button from './ui/Button'

interface TagSelectorProps {
  contactId: string
  contactName: string
  currentTagIds: string[]
  onClose: () => void
}

interface Tag {
  id: string
  name: string
  color: string
  description?: string
}

export default function TagSelector({
  contactId,
  contactName,
  currentTagIds,
  onClose,
}: TagSelectorProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTagIds || [])
  const queryClient = useQueryClient()

  useEffect(() => {
    setSelectedTags(currentTagIds || [])
  }, [currentTagIds])

  // Fetch all tags
  const { data: tagsResponse, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await tagsAPI.getTags()
      return res.data
    },
  })

  const tags: Tag[] = tagsResponse?.data || []

  // Add tags mutation
  const addTagsMutation = useMutation({
    mutationFn: () => contactsAPI.addTagsToContact(contactId, selectedTags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Tags atualizadas com sucesso!')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar tags')
    },
  })

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleSave = () => {
    addTagsMutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-clinic-black border border-clinic-royal/20 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-clinic-royal/20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TagIcon size={24} />
              Gerenciar Tags
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} className="text-clinic-gray-400" />
            </button>
          </div>
          <p className="text-clinic-gray-400">
            Selecione as tags para <span className="text-white font-medium">{contactName}</span>
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-8 text-clinic-gray-400">Carregando tags...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12">
              <TagIcon size={48} className="mx-auto mb-4 text-clinic-gray-600" />
              <p className="text-clinic-gray-400 mb-2">Nenhuma tag disponível</p>
              <p className="text-sm text-clinic-gray-500">
                Crie tags primeiro na página de Tags
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-clinic-royal bg-clinic-royal/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium text-white truncate">{tag.name}</span>
                      </div>
                      {isSelected && (
                        <Check size={18} className="text-clinic-royal flex-shrink-0" />
                      )}
                    </div>
                    {tag.description && (
                      <p className="text-sm text-clinic-gray-400 mt-2 line-clamp-2">
                        {tag.description}
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
            disabled={addTagsMutation.isPending || tags.length === 0}
            className="flex-1 bg-clinic-royal hover:bg-clinic-royal/80"
          >
            {addTagsMutation.isPending ? 'Salvando...' : `Salvar (${selectedTags.length} selecionadas)`}
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
