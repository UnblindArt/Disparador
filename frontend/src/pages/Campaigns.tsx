import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Play, Pause, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { campaignsAPI } from '../services/api'
import { Campaign } from '../types'
import { formatDateTime } from '../lib/utils'

export default function Campaigns() {
  const [showForm, setShowForm] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    targetType: 'all' as const,
  })
  const queryClient = useQueryClient()

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await campaignsAPI.getAll()
      return res.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Campaign>) => campaignsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campanha criada!')
      setShowForm(false)
      setNewCampaign({ name: '', message: '', targetType: 'all' })
    },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Campanhas</h1>
          <p className="text-clinic-gray-300">Envio em massa de mensagens</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-2" />
          Nova Campanha
        </Button>
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
              <div className="flex gap-3">
                <Button onClick={() => createMutation.mutate(newCampaign)}>
                  Criar e Enviar
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{campaign.name}</h3>
                  <p className="text-clinic-gray-400 text-sm mb-4">{campaign.message}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-3 py-1 rounded-full ${statusColors[campaign.status]}`}>
                      {campaign.status}
                    </span>
                    <span className="text-clinic-gray-400">
                      {campaign.total_contacts} destinatários
                    </span>
                    <span className="text-clinic-gray-400">
                      {formatDateTime(campaign.created_at)}
                    </span>
                  </div>
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
            </CardContent>
          </Card>
        ))}
        {!campaigns?.length && (
          <Card className="border-none bg-white/10 backdrop-blur-md">
            <CardContent className="p-12 text-center">
              <p className="text-clinic-gray-400">Nenhuma campanha criada ainda</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
