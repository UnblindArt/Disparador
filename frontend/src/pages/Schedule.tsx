import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, User, Phone, RefreshCw, CheckCircle, XCircle, MessageCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { appointmentsAPI } from '../services/api'
import { toast } from 'sonner'

interface Appointment {
  id: string
  title: string
  description?: string
  contact_id?: string
  contact_name?: string
  contact_phone?: string
  appointment_type?: string
  location?: string
  notes?: string
  scheduled_at: string
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  updated_at: string
}

export default function Schedule() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await appointmentsAPI.getAll({
        date: selectedDate,
        limit: 50
      })
      setAppointments(response.data.data || [])
    } catch (error: any) {
      console.error('Error fetching appointments:', error)
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate])

  // Handle actions
  const handleConfirm = async () => {
    try {
      // TODO: Integrate with WhatsApp API to send confirmation
      toast.success('Confirmação enviada via WhatsApp!')
      fetchAppointments()
    } catch (error) {
      toast.error('Erro ao confirmar agendamento')
    }
  }

  const handleCancel = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return

    try {
      await appointmentsAPI.cancel(id)
      toast.success('Agendamento cancelado')
      fetchAppointments()
    } catch (error) {
      toast.error('Erro ao cancelar agendamento')
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await appointmentsAPI.complete(id)
      toast.success('Agendamento marcado como concluído')
      fetchAppointments()
    } catch (error) {
      toast.error('Erro ao completar agendamento')
    }
  }

  const handleSendReminder = async () => {
    // TODO: Integrate with WhatsApp API to send reminder
    toast.success('Lembrete enviado via WhatsApp!')
  }

  // Calculate stats
  const todayAppointments = appointments.filter(apt =>
    new Date(apt.scheduled_at).toDateString() === new Date(selectedDate).toDateString()
  )

  const confirmedCount = todayAppointments.filter(apt => apt.status === 'confirmed').length
  const scheduledCount = todayAppointments.filter(apt => apt.status === 'scheduled').length
  const totalToday = todayAppointments.length

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-300',
    confirmed: 'bg-green-500/20 text-green-300',
    cancelled: 'bg-red-500/20 text-red-300',
    completed: 'bg-gray-500/20 text-gray-300',
  }

  const statusLabels: Record<string, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
  }

  // Format date and time
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Agenda Inteligente</h1>
          <p className="text-clinic-gray-300">Agendamentos integrados ao WhatsApp</p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            variant="outline"
            onClick={fetchAppointments}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500">
                <CalendarIcon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-clinic-gray-300">Agendados Hoje</p>
                <p className="text-2xl font-bold text-white">{totalToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500">
                <CheckCircle size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-clinic-gray-300">Confirmados</p>
                <p className="text-2xl font-bold text-white">{confirmedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-orange-500">
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-clinic-gray-300">Aguardando</p>
                <p className="text-2xl font-bold text-white">{scheduledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Agendamentos do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-white" size={32} />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto mb-4 text-clinic-gray-400" size={48} />
              <p className="text-clinic-gray-400">Nenhum agendamento encontrado para esta data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => {
                const { date, time } = formatDateTime(apt.scheduled_at)
                return (
                  <div
                    key={apt.id}
                    className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{apt.title}</h3>
                        {apt.contact_name && (
                          <p className="text-clinic-gray-300 text-sm mt-1">
                            <User size={14} className="inline mr-1" />
                            {apt.contact_name}
                          </p>
                        )}
                        {apt.contact_phone && (
                          <p className="text-clinic-gray-400 text-sm flex items-center gap-2 mt-1">
                            <Phone size={14} />
                            {apt.contact_phone}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${statusColors[apt.status]}`}>
                        {statusLabels[apt.status]}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-clinic-gray-300 mb-3">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={16} />
                        {date}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        {time}
                      </div>
                      {apt.appointment_type && (
                        <span className="text-blue-400">• {apt.appointment_type}</span>
                      )}
                    </div>

                    {apt.description && (
                      <p className="text-white mb-3">{apt.description}</p>
                    )}

                    {apt.location && (
                      <p className="text-clinic-gray-400 text-sm mb-3">
                        📍 {apt.location}
                      </p>
                    )}

                    <div className="flex gap-2 mt-4 flex-wrap">
                      {apt.status === 'scheduled' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleConfirm()}
                          >
                            <MessageCircle size={14} className="mr-1" />
                            Confirmar via WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(apt.id)}
                          >
                            <XCircle size={14} className="mr-1" />
                            Cancelar
                          </Button>
                        </>
                      )}
                      {apt.status === 'confirmed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendReminder()}
                          >
                            <MessageCircle size={14} className="mr-1" />
                            Lembrete WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleComplete(apt.id)}
                          >
                            <CheckCircle size={14} className="mr-1" />
                            Marcar Concluído
                          </Button>
                        </>
                      )}
                      {apt.status === 'completed' && (
                        <span className="text-green-400 text-sm flex items-center gap-2">
                          <CheckCircle size={16} />
                          Atendimento concluído
                        </span>
                      )}
                      {apt.status === 'cancelled' && (
                        <span className="text-red-400 text-sm flex items-center gap-2">
                          <XCircle size={16} />
                          Agendamento cancelado
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
