import { useState } from 'react'
import { Calendar as CalendarIcon, Clock, User, Phone } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Schedule() {
  const [appointments] = useState([
    {
      id: '1',
      patientName: 'Maria Silva',
      phone: '(47) 99999-9999',
      service: 'Consulta Inicial - Rinoplastia',
      date: '2025-10-25',
      time: '14:00',
      status: 'confirmed',
    },
    {
      id: '2',
      patientName: 'João Santos',
      phone: '(47) 98888-8888',
      service: 'Pós-operatório - Lipoaspiração',
      date: '2025-10-25',
      time: '15:30',
      status: 'scheduled',
    },
  ])

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Agenda Inteligente</h1>
        <p className="text-clinic-gray-300">Agendamentos integrados ao WhatsApp</p>
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
                <p className="text-2xl font-bold text-white">2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500">
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-clinic-gray-300">Confirmados</p>
                <p className="text-2xl font-bold text-white">1</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-orange-500">
                <User size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-clinic-gray-300">Aguardando</p>
                <p className="text-2xl font-bold text-white">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{apt.patientName}</h3>
                    <p className="text-clinic-gray-400 text-sm flex items-center gap-2 mt-1">
                      <Phone size={14} />
                      {apt.phone}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${statusColors[apt.status]}`}>
                    {statusLabels[apt.status]}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-clinic-gray-300">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} />
                    {new Date(apt.date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    {apt.time}
                  </div>
                </div>
                <p className="mt-3 text-white">{apt.service}</p>
                <div className="flex gap-2 mt-4">
                  {apt.status === 'scheduled' && (
                    <>
                      <Button size="sm" variant="secondary">Confirmar via WhatsApp</Button>
                      <Button size="sm" variant="outline">Reagendar</Button>
                    </>
                  )}
                  {apt.status === 'confirmed' && (
                    <Button size="sm" variant="outline">Lembrete WhatsApp</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
