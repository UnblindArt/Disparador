import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Play, Pause, X, Users, Tag, Package, RefreshCw, Calendar, Image, Eye, CheckCircle, Clock, AlertCircle, Layers } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { campaignsAPI, contactsAPI, tagsAPI, type CadenceMedia } from '../services/api'
import { Campaign } from '../types'
import { formatDateTime } from '../lib/utils'
import CadenceWizard from '../components/CadenceWizard'

type TargetType = 'all' | 'tag' | 'individual'
type CampaignMode = 'single' | 'cadence'

interface CadenceDay {
  day_number: number
  message: string
  send_time: string
  media: CadenceMedia[]
}

export default function Campaigns() {
  const [showForm, setShowForm] = useState(false)
  const [campaignMode, setCampaignMode] = useState<CampaignMode>('single')
  const [cadences, setCadences] = useState<CadenceDay[]>([])
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
    minDelay: 3,
    maxDelay: 10,
  })
  const [estimatedContacts, setEstimatedContacts] = useState(0)

  const queryClient = useQueryClient()

  // Calculate estimated campaign duration
  const calculateDuration = (contacts: number, minDelay: number, maxDelay: number) => {
    if (contacts === 0) return null
    const avgDelay = (minDelay + maxDelay) / 2
    const totalSeconds = contacts * avgDelay
    const minutes = Math.floor(totalSeconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`
    } else if (minutes > 0) {
      return `${minutes} minutos`
    } else {
      return `${Math.ceil(totalSeconds)} segundos`
    }
  }

  // Check if delay configuration is safe
  const isDelaySafe = () => {
    const avgDelay = (newCampaign.minDelay + newCampaign.maxDelay) / 2

    if (estimatedContacts > 100 && avgDelay < 10) {
      return { safe: false, level: 'danger', message: 'Campanha grande com delay muito curto. Alto risco de bloqueio!' }
    } else if (estimatedContacts > 50 && avgDelay < 5) {
      return { safe: false, level: 'danger', message: 'Delay muito curto para esta quantidade de contatos!' }
    } else if (estimatedContacts > 50 && avgDelay < 10) {
      return { safe: false, level: 'warning', message: 'Recomendamos aumentar o delay para pelo menos 10-15 segundos.' }
    } else if (avgDelay < 5) {
      return { safe: false, level: 'warning', message: 'Delay abaixo do recomendado. Considere aumentar para 5-15 segundos.' }
    } else if (avgDelay >= 5 && avgDelay <= 15) {
      return { safe: true, level: 'good', message: 'Configuração segura para produção!' }
    } else if (avgDelay > 15) {
      return { safe: true, level: 'excellent', message: 'Configuração extra segura - ideal para campanhas grandes!' }
    }
    return { safe: true, level: 'good', message: 'Configuração OK' }
  }

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
        minDelay: 3,
        maxDelay: 10,
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

  const handleSubmit = async () => {
    if (!newCampaign.name) {
      toast.error('Preencha o nome da campanha')
      return
    }

    // Validação para modo single
    if (campaignMode === 'single' && !newCampaign.message) {
      toast.error('Preencha a mensagem')
      return
    }

    // Validação para modo cadence
    if (campaignMode === 'cadence') {
      if (cadences.length === 0) {
        toast.error('Adicione pelo menos um dia à cadência')
        return
      }

      for (const cadence of cadences) {
        if (!cadence.message) {
          toast.error(`Preencha a mensagem do Dia ${cadence.day_number}`)
          return
        }
        if (!cadence.send_time) {
          toast.error(`Configure o horário de envio do Dia ${cadence.day_number}`)
          return
        }
      }
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
      target_type: newCampaign.targetType,
      tags: newCampaign.targetType === 'tag' ? newCampaign.tags :
            newCampaign.targetType === 'individual' ? newCampaign.contacts : [],
      send_immediately: newCampaign.sendImmediately,
      delayMin: newCampaign.minDelay,
      delayMax: newCampaign.maxDelay,
    }

    // Single message mode
    if (campaignMode === 'single') {
      submitData.message = newCampaign.message
      submitData.has_cadence = false

      if (newCampaign.mediaUrl && newCampaign.mediaType) {
        submitData.media_url = newCampaign.mediaUrl
        submitData.media_type = newCampaign.mediaType
      }
    }

    // Cadence mode
    if (campaignMode === 'cadence') {
      submitData.has_cadence = true
      submitData.message = `Cadência com ${cadences.length} dia(s)` // Placeholder
    }

    if (!newCampaign.sendImmediately && newCampaign.scheduleFor) {
      submitData.scheduled_for = newCampaign.scheduleFor
    }

    try {
      // Create campaign
      const result = await createMutation.mutateAsync(submitData)

      // If cadence mode, create cadences
      if (campaignMode === 'cadence' && result?.data) {
        const campaignId = (result.data as any).id

        for (const cadence of cadences) {
          await campaignsAPI.createCadence(campaignId, {
            day_number: cadence.day_number,
            message: cadence.message,
            send_time: cadence.send_time,
            media: cadence.media.filter(m => m.media_url && m.media_type)
          })
        }
      }

      // Reset form
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
        minDelay: 3,
        maxDelay: 10,
      })
      setCadences([])
      setCampaignMode('single')

      toast.success('Campanha criada com sucesso!')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao criar campanha')
    }
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

              {/* Campaign Mode Selector */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <label className="block text-sm font-medium text-white mb-2">Modo de Campanha</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCampaignMode('single')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      campaignMode === 'single'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-clinic-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Image className="mx-auto mb-1" size={20} />
                    <span className="text-xs block">Mensagem Única</span>
                    <span className="text-xs text-clinic-gray-400 block mt-1">Envia uma vez para todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignMode('cadence')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      campaignMode === 'cadence'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-clinic-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Layers className="mx-auto mb-1" size={20} />
                    <span className="text-xs block">Cadência</span>
                    <span className="text-xs text-clinic-gray-400 block mt-1">Sequência de mensagens</span>
                  </button>
                </div>
              </div>

              {/* Delay Configuration - Enhanced */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Clock size={18} className="text-blue-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Proteção Anti-Bloqueio</h4>
                    <p className="text-xs text-blue-200">Intervalo aleatório entre mensagens</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">Mínimo (segundos)</label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={newCampaign.minDelay}
                      onChange={(e) => setNewCampaign({ ...newCampaign, minDelay: parseInt(e.target.value) || 3 })}
                      className="w-full px-3 py-2 bg-white/20 text-white border border-blue-400/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">Máximo (segundos)</label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={newCampaign.maxDelay}
                      onChange={(e) => setNewCampaign({ ...newCampaign, maxDelay: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 bg-white/20 text-white border border-blue-400/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Safety Status Indicator */}
                {(() => {
                  const safetyCheck = isDelaySafe()
                  const avgDelay = ((newCampaign.minDelay + newCampaign.maxDelay) / 2).toFixed(1)

                  return (
                    <div className={`p-3 rounded-lg border mb-3 ${
                      safetyCheck.level === 'danger' ? 'bg-red-500/20 border-red-500/50' :
                      safetyCheck.level === 'warning' ? 'bg-yellow-500/20 border-yellow-500/50' :
                      safetyCheck.level === 'excellent' ? 'bg-green-500/20 border-green-500/50' :
                      'bg-blue-500/20 border-blue-500/50'
                    }`}>
                      <div className="flex items-start gap-2">
                        {safetyCheck.level === 'danger' || safetyCheck.level === 'warning' ? (
                          <AlertCircle size={16} className={`mt-0.5 flex-shrink-0 ${
                            safetyCheck.level === 'danger' ? 'text-red-300' : 'text-yellow-300'
                          }`} />
                        ) : (
                          <CheckCircle size={16} className="text-green-300 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className={`text-xs font-medium ${
                            safetyCheck.level === 'danger' ? 'text-red-200' :
                            safetyCheck.level === 'warning' ? 'text-yellow-200' :
                            safetyCheck.level === 'excellent' ? 'text-green-200' :
                            'text-blue-200'
                          }`}>
                            {safetyCheck.message}
                          </p>
                          <p className="text-xs text-white/70 mt-1">
                            Delay médio: <strong>{avgDelay}s</strong>
                            {estimatedContacts > 0 && calculateDuration(estimatedContacts, newCampaign.minDelay, newCampaign.maxDelay) && (
                              <> • Tempo estimado: <strong>{calculateDuration(estimatedContacts, newCampaign.minDelay, newCampaign.maxDelay)}</strong></>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Recommended Settings */}
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <p className="text-xs text-blue-200 font-medium mb-1">💡 Configurações Recomendadas:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setNewCampaign({ ...newCampaign, minDelay: 3, maxDelay: 5 })}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      Teste: 3-5s
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampaign({ ...newCampaign, minDelay: 5, maxDelay: 15 })}
                      className="px-2 py-1 rounded bg-blue-500/30 hover:bg-blue-500/40 text-white transition-colors font-medium"
                    >
                      ✓ Seguro: 5-15s
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCampaign({ ...newCampaign, minDelay: 10, maxDelay: 30 })}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      Extra: 10-30s
                    </button>
                  </div>
                </div>
              </div>

              {/* Single Message Mode */}
              {campaignMode === 'single' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">Mensagem</label>
                    <textarea
                      value={newCampaign.message}
                      onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                      placeholder="Digite sua mensagem aqui... Use {{name}} para personalizar!"
                      rows={4}
                      className="w-full rounded-lg border border-clinic-gray-300 bg-white/20 text-white px-3 py-2 placeholder:text-clinic-gray-400 focus:outline-none focus:ring-2 focus:ring-clinic-royal"
                    />
                    <div className="mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <p className="text-xs text-purple-200">
                        <strong>💡 Personalize suas mensagens:</strong> Use <code className="px-1 py-0.5 bg-white/20 rounded">{'{{name}}'}</code>, <code className="px-1 py-0.5 bg-white/20 rounded">{'{{phone}}'}</code>, ou <code className="px-1 py-0.5 bg-white/20 rounded">{'{{email}}'}</code> para tornar cada mensagem única e evitar detecção de spam.
                      </p>
                      <p className="text-xs text-purple-200 mt-1">
                        <strong>Exemplo:</strong> "Olá {'{{name}}'}, temos uma oferta especial para você!"
                      </p>
                    </div>
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
                </>
              )}

              {/* Cadence Mode */}
              {campaignMode === 'cadence' && (
                <CadenceWizard
                  cadences={cadences}
                  onChange={setCadences}
                />
              )}

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
