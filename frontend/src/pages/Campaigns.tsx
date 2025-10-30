import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Play, Pause, X, Users, Tag, Package, RefreshCw, Calendar, Image, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { campaignsAPI, contactsAPI, tagsAPI } from '../services/api'
import { Campaign } from '../types'
import { formatDateTime } from '../lib/utils'

type TargetType = 'all' | 'tag' | 'individual'

export default function Campaigns() {
  const [showForm, setShowForm] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    targetType: 'all' as TargetType,
    tags: [] as string[],
    contacts: [] as string[],
    scheduleFor: '',
    sendImmediately: true,
    mediaUrl: '',
    mediaType: '',
  })
  const [estimatedContacts, setEstimatedContacts] = useState(0)

  const queryClient = useQueryClient()

  // Fetch data for selectors
  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await contactsAPI.getAll()
      return res.data.data
    },
    enabled: newCampaign.targetType === 'individual'
  })

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await tagsAPI.getTags()
      return res.data.data || []
    },
    enabled: newCampaign.targetType === 'tag'
  })

  const { data: campaigns, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await campaignsAPI.getAll()
      return res.data.data
    },
  })

  // Estimate contacts when target changes
  useEffect(() => {
    const estimateContacts = async () => {
      if (newCampaign.targetType === 'all') {
        // Fetch total contacts
        try {
          const res = await contactsAPI.getAll()
          setEstimatedContacts(res.data.data?.length || 0)
        } catch (error) {
          setEstimatedContacts(0)
        }
      } else if (newCampaign.targetType === 'individual') {
        setEstimatedContacts(newCampaign.contacts.length)
      } else if (newCampaign.targetType === 'tag' && newCampaign.tags.length > 0) {
        // Fetch contact count for each tag and sum
        try {
          const counts = await Promise.all(
            newCampaign.tags.map(tagId => tagsAPI.getContactsCountByTag(tagId))
          )
          const totalCount = counts.reduce((sum, res) => sum + (res.data.data?.count || 0), 0)
          setEstimatedContacts(totalCount)
        } catch (error) {
          setEstimatedContacts(0)
        }
      } else {
        setEstimatedContacts(0)
      }
    }

    estimateContacts()
  }, [newCampaign.targetType, newCampaign.tags, newCampaign.contacts])

  const createMutation = useMutation({
    mutationFn: (data: Partial<Campaign>) => campaignsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campanha criada e enviando!')
      setShowForm(false)
      setNewCampaign({
        name: '',
        message: '',
        targetType: 'all',
        tags: [],
        contacts: [],
        scheduleFor: '',
        sendImmediately: true,
        mediaUrl: '',
        mediaType: '',
      })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao criar campanha')
    }
  })

  const pauseMutation = useMutation({
    mutationFn: (id: string) => campaignsAPI.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campanha pausada!')
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => campaignsAPI.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campanha retomada!')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => campaignsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campanha cancelada!')
    },
  })

  const handleSubmit = () => {
    if (!newCampaign.name || !newCampaign.message) {
      toast.error('Preencha nome e mensagem')
      return
    }

    if (newCampaign.targetType === 'tag' && newCampaign.tags.length === 0) {
      toast.error('Selecione pelo menos uma tag')
      return
    }

    if (newCampaign.targetType === 'individual' && newCampaign.contacts.length === 0) {
      toast.error('Selecione pelo menos um contato')
      return
    }

    const submitData: any = {
      name: newCampaign.name,
      message: newCampaign.message,
      target_type: newCampaign.targetType,
      tags: newCampaign.targetType === 'tag' ? newCampaign.tags :
            newCampaign.targetType === 'individual' ? newCampaign.contacts : [],
      send_immediately: newCampaign.sendImmediately,
    }

    if (!newCampaign.sendImmediately && newCampaign.scheduleFor) {
      submitData.scheduled_for = newCampaign.scheduleFor
    }

    if (newCampaign.mediaUrl && newCampaign.mediaType) {
      submitData.media_url = newCampaign.mediaUrl
      submitData.media_type = newCampaign.mediaType
    }

    createMutation.mutate(submitData)
  }

  const toggleTag = (tagId: string) => {
    setNewCampaign(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }))
  }

  // toggleProduct removed - backend doesn't support products in campaigns

  const toggleContact = (contactId: string) => {
    setNewCampaign(prev => ({
      ...prev,
      contacts: prev.contacts.includes(contactId)
        ? prev.contacts.filter(id => id !== contactId)
        : [...prev.contacts, contactId]
    }))
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-300',
    scheduled: 'bg-blue-500/20 text-blue-300',
    active: 'bg-green-500/20 text-green-300',
    processing: 'bg-yellow-500/20 text-yellow-300',
    completed: 'bg-green-600/20 text-green-300',
    paused: 'bg-orange-500/20 text-orange-300',
    cancelled: 'bg-red-500/20 text-red-300',
    failed: 'bg-red-600/20 text-red-300',
  }

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    scheduled: 'Agendada',
    active: 'Ativa',
    processing: 'Processando',
    completed: 'Concluída',
    paused: 'Pausada',
    cancelled: 'Cancelada',
    failed: 'Falhou',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Campanhas</h1>
          <p className="text-clinic-gray-300">Envio em massa de mensagens</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw size={16} />
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={18} className="mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Criar Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Nome da Campanha"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                placeholder="Ex: Lembretes de Consulta"
                className="bg-white/20 text-white placeholder:text-clinic-gray-400"
              />

              <div>
                <label className="block text-sm font-medium text-white mb-1">Mensagem</label>
                <textarea
                  value={newCampaign.message}
                  onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                  placeholder="Digite sua mensagem aqui..."
                  rows={4}
                  className="w-full rounded-lg border border-clinic-gray-300 bg-white/20 text-white px-3 py-2 placeholder:text-clinic-gray-400 focus:outline-none focus:ring-2 focus:ring-clinic-royal"
                />
              </div>

              {/* Media Section */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Image size={16} />
                  Mídia (opcional)
                </label>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-clinic-gray-400 mb-1">Tipo de Mídia</label>
                      <select
                        value={newCampaign.mediaType}
                        onChange={(e) => setNewCampaign({ ...newCampaign, mediaType: e.target.value })}
                        className="w-full px-3 py-2 bg-white/20 text-white border border-clinic-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-royal"
                      >
                        <option value="" className="bg-clinic-black">Nenhuma</option>
                        <option value="image" className="bg-clinic-black">Imagem</option>
                        <option value="video" className="bg-clinic-black">Vídeo</option>
                        <option value="audio" className="bg-clinic-black">Áudio</option>
                        <option value="document" className="bg-clinic-black">Documento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-clinic-gray-400 mb-1">URL da Mídia</label>
                      <Input
                        value={newCampaign.mediaUrl}
                        onChange={(e) => setNewCampaign({ ...newCampaign, mediaUrl: e.target.value })}
                        placeholder="https://..."
                        className="bg-white/20 text-white placeholder:text-clinic-gray-400"
                        disabled={!newCampaign.mediaType}
                      />
                    </div>
                  </div>
                  {newCampaign.mediaUrl && (
                    <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30">
                      <p className="text-xs text-blue-300">
                        ✓ Mídia será anexada à mensagem
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduling Section */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  Agendamento
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCampaign.sendImmediately}
                      onChange={(e) => setNewCampaign({ ...newCampaign, sendImmediately: e.target.checked, scheduleFor: '' })}
                      className="rounded"
                    />
                    <span className="text-white text-sm">Enviar imediatamente</span>
                  </label>

                  {!newCampaign.sendImmediately && (
                    <div>
                      <label className="block text-xs text-clinic-gray-400 mb-1">Data e Hora de Envio</label>
                      <input
                        type="datetime-local"
                        value={newCampaign.scheduleFor}
                        onChange={(e) => setNewCampaign({ ...newCampaign, scheduleFor: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full px-3 py-2 bg-white/20 text-white border border-clinic-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-royal"
                      />
                      {newCampaign.scheduleFor && (
                        <p className="text-xs text-blue-300 mt-1">
                          📅 Será enviado em {new Date(newCampaign.scheduleFor).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Target Type Selector */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Quem vai receber?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCampaign({ ...newCampaign, targetType: 'all', tags: [], contacts: [] })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      newCampaign.targetType === 'all'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-clinic-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Users className="mx-auto mb-1" size={20} />
                    <span className="text-xs">Todos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCampaign({ ...newCampaign, targetType: 'tag', contacts: [] })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      newCampaign.targetType === 'tag'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-clinic-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Tag className="mx-auto mb-1" size={20} />
                    <span className="text-xs">Por Tags</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCampaign({ ...newCampaign, targetType: 'individual', tags: [] })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      newCampaign.targetType === 'individual'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-clinic-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Users className="mx-auto mb-1" size={20} />
                    <span className="text-xs">Específicos</span>
                  </button>
                </div>
              </div>

              {/* Tags Selector */}
              {newCampaign.targetType === 'tag' && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <label className="block text-sm font-medium text-white mb-2">
                    Selecione as Tags ({newCampaign.tags.length} selecionadas)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {tags && tags.length > 0 ? tags.map((tag: any) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          newCampaign.tags.includes(tag.id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-clinic-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {tag.name}
                      </button>
                    )) : (
                      <p className="text-clinic-gray-400 text-sm">Nenhuma tag cadastrada. <a href="/tags" className="text-blue-400">Criar tags</a></p>
                    )}
                  </div>
                </div>
              )}

              {/* Products removed - not supported by backend schema */}

              {/* Contacts Selector */}
              {newCampaign.targetType === 'individual' && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <label className="block text-sm font-medium text-white mb-2">
                    Selecione os Contatos ({newCampaign.contacts.length} selecionados)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {contacts && contacts.length > 0 ? contacts.map((contact: any) => (
                      <label
                        key={contact.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newCampaign.contacts.includes(contact.id)}
                          onChange={() => toggleContact(contact.id)}
                          className="rounded"
                        />
                        <span className="text-white text-sm">{contact.name || contact.phone}</span>
                        <span className="text-clinic-gray-400 text-xs">{contact.phone}</span>
                      </label>
                    )) : (
                      <p className="text-clinic-gray-400 text-sm">Nenhum contato cadastrado.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Estimated Contacts */}
              {estimatedContacts > 0 && (
                <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/50">
                  <p className="text-blue-300 text-sm">
                    📊 Aproximadamente <strong>{estimatedContacts} contatos</strong> receberão esta mensagem
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar e Enviar'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {campaigns?.map((campaign: Campaign) => (
          <Card key={campaign.id} className="border-none bg-white/10 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{campaign.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs ${statusColors[campaign.status]}`}>
                      {statusLabels[campaign.status] || campaign.status}
                    </span>
                  </div>
                  <p className="text-clinic-gray-400 text-sm mb-3 line-clamp-2">{campaign.message}</p>
                </div>
                <div className="flex gap-2">
                  {campaign.status === 'active' && (
                    <Button size="sm" variant="secondary" onClick={() => pauseMutation.mutate(campaign.id)}>
                      <Pause size={16} />
                    </Button>
                  )}
                  {campaign.status === 'paused' && (
                    <Button size="sm" onClick={() => resumeMutation.mutate(campaign.id)}>
                      <Play size={16} />
                    </Button>
                  )}
                  {(campaign.status === 'active' || campaign.status === 'paused') && (
                    <Button size="sm" variant="danger" onClick={() => cancelMutation.mutate(campaign.id)}>
                      <X size={16} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Campaign Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-clinic-gray-400 text-xs mb-1">
                    <Users size={12} />
                    <span>Destinatários</span>
                  </div>
                  <p className="text-white text-lg font-semibold">{campaign.total_contacts || 0}</p>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
                    <CheckCircle size={12} />
                    <span>Enviados</span>
                  </div>
                  <p className="text-white text-lg font-semibold">{campaign.total_sent || 0}</p>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-blue-400 text-xs mb-1">
                    <Eye size={12} />
                    <span>Lidos</span>
                  </div>
                  <p className="text-white text-lg font-semibold">{campaign.total_read || 0}</p>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
                    <AlertCircle size={12} />
                    <span>Falhas</span>
                  </div>
                  <p className="text-white text-lg font-semibold">{campaign.total_failed || 0}</p>
                </div>
              </div>

              {/* Campaign Meta Info */}
              <div className="flex items-center gap-4 text-xs text-clinic-gray-400 flex-wrap">
                <span className="flex items-center gap-1">
                  🎯 {campaign.target_type === 'all' ? 'Todos os contatos' :
                       campaign.target_type === 'tag' ? 'Por Tags' :
                       'Contatos Específicos'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDateTime(campaign.created_at)}
                </span>
                {campaign.scheduled_start && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Agendado: {formatDateTime(campaign.scheduled_start)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!campaigns?.length && (
          <Card className="border-none bg-white/10 backdrop-blur-md">
            <CardContent className="p-12 text-center">
              <Package className="mx-auto mb-4 text-clinic-gray-400" size={48} />
              <p className="text-clinic-gray-400">Nenhuma campanha criada ainda</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus size={18} className="mr-2" />
                Criar Primeira Campanha
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
