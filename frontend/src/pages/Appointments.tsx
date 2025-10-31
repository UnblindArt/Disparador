import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  Check,
  Ban,
  Trash2,
  User,
  MapPin,
  FileText
} from 'lucide-react'
import { appointmentsAPI, contactsAPI } from '../services/api'

export default function Appointments() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    appointmentType: 'meeting',
    contactId: '',
    startTime: '',
    location: '',
    notes: ''
  })

  // Get appointments
  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await appointmentsAPI.getAll()
      return res.data.data
    }
  })

  // Get contacts for dropdown
  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await contactsAPI.getContacts({})
      return res.data.data
    }
  })

  // Create appointment
  const createMutation = useMutation({
    mutationFn: (data: any) => appointmentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setShowCreateModal(false)
      setFormData({
        title: '',
        description: '',
        appointmentType: 'meeting',
        contactId: '',
        startTime: '',
        location: '',
        notes: ''
      })
      toast.success('Agendamento criado!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar agendamento')
    }
  })

  // Cancel appointment
  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Agendamento cancelado!')
    }
  })

  // Complete appointment
  const completeMutation = useMutation({
    mutationFn: (id: string) => appointmentsAPI.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Agendamento concluído!')
    }
  })

  // Delete appointment
  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Agendamento deletado!')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'no_show': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      meeting: 'Reunião',
      consultation: 'Consulta',
      call: 'Ligação',
      follow_up: 'Follow-up'
    }
    return types[type] || type
  }

  // Filter appointments by selected date
  const filteredAppointments = appointmentsData?.filter((apt: any) => {
    const aptDate = new Date(apt.start_time).toISOString().split('T')[0]
    return aptDate === selectedDate
  }) || []

  // Get upcoming appointments (next 7 days)
  const upcomingAppointments = appointmentsData?.filter((apt: any) => {
    const aptDate = new Date(apt.start_time)
    const now = new Date()
    const weekLater = new Date()
    weekLater.setDate(weekLater.getDate() + 7)
    return aptDate >= now && aptDate <= weekLater && ['scheduled', 'confirmed'].includes(apt.status)
  }).slice(0, 5) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Agendamento
            </button>
          </div>
          <p className="text-gray-600">Gerencie seus agendamentos e compromissos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar & Upcoming */}
          <div className="lg:col-span-1 space-y-6">
            {/* Date Picker */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Selecionar Data
              </h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="mt-4 text-sm text-gray-600">
                {filteredAppointments.length} agendamento(s) nesta data
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Próximos 7 Dias</h2>
              <div className="space-y-3">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((apt: any) => (
                    <div
                      key={apt.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setSelectedDate(new Date(apt.start_time).toISOString().split('T')[0])}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{apt.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        {formatDate(apt.start_time)}
                      </div>
                      {apt.contacts && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <User className="w-3 h-3" />
                          {apt.contacts.name}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum agendamento próximo
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Appointments List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="font-semibold text-gray-900">
                  Agendamentos - {new Date(selectedDate).toLocaleDateString('pt-BR')}
                </h2>
              </div>

              <div className="divide-y">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((apt: any) => (
                    <div key={apt.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{apt.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(apt.status)}`}>
                              {apt.status}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                              {getTypeLabel(apt.appointment_type)}
                            </span>
                          </div>
                          {apt.description && (
                            <p className="text-sm text-gray-600 mb-2">{apt.description}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {apt.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => completeMutation.mutate(apt.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Concluir"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => cancelMutation.mutate(apt.id)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Cancelar"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(apt.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(apt.start_time)} - {new Date(apt.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {apt.contacts && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{apt.contacts.name} ({apt.contacts.phone})</span>
                          </div>
                        )}
                        {apt.location && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{apt.location}</span>
                          </div>
                        )}
                        {apt.notes && (
                          <div className="flex items-start gap-2 text-gray-600 col-span-2">
                            <FileText className="w-4 h-4 mt-0.5" />
                            <span>{apt.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum agendamento nesta data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Novo Agendamento</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Reunião com cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Detalhes do agendamento"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.appointmentType}
                    onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="meeting">Reunião</option>
                    <option value="consultation">Consulta</option>
                    <option value="call">Ligação</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contato
                  </label>
                  <select
                    value={formData.contactId}
                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecione um contato</option>
                    {contactsData?.map((contact: any) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} ({contact.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data/Hora do Agendamento *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Selecione a data e hora do agendamento</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Escritório, Zoom, etc"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Observações adicionais"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
