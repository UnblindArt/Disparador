import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  X, Phone, FileText,
  Link as LinkIcon, Plus, Clock
} from 'lucide-react'
import { contactsAPI, appointmentsAPI } from '../services/api'
import ContactTagsProducts from './ContactTagsProducts'

interface ContactProfileProps {
  contactPhone: string
  contactName: string
  onClose: () => void
}

export default function ContactProfile({ contactPhone, contactName, onClose }: ContactProfileProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'links' | 'docs' | 'appointments'>('info')
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [appointmentData, setAppointmentData] = useState({
    title: '',
    appointmentType: 'meeting',
    startTime: '',
    endTime: '',
    location: '',
    notes: ''
  })

  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await contactsAPI.getContacts({})
      return res.data.data
    }
  })

  const contact = contacts?.find((c: any) => c.phone === contactPhone)

  const { data: mediaData } = useQuery({
    queryKey: ['contact-media', contact?.id],
    queryFn: async () => {
      if (!contact?.id) return null
      const res = await contactsAPI.getContactMedia(contact.id)
      return res.data.data
    },
    enabled: !!contact?.id
  })

  const { data: appointmentsData } = useQuery({
    queryKey: ['contact-appointments', contact?.id],
    queryFn: async () => {
      if (!contact?.id) return []
      const res = await appointmentsAPI.getAll({ contactId: contact.id })
      return res.data.data
    },
    enabled: !!contact?.id
  })

  const createAppointmentMutation = useMutation({
    mutationFn: (data: any) => appointmentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-appointments'] })
      setShowAppointmentForm(false)
      setAppointmentData({
        title: '',
        appointmentType: 'meeting',
        startTime: '',
        endTime: '',
        location: '',
        notes: ''
      })
      toast.success('Agendamento criado!')
    }
  })

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact?.id) return
    createAppointmentMutation.mutate({
      ...appointmentData,
      contactId: contact.id
    })
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

  return (
    <div className="w-96 bg-white border-l flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Perfil do Contato</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 border-b text-center">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3">
          <Phone className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="font-semibold text-lg text-gray-900">{contactName}</h3>
        <p className="text-sm text-gray-500">{contactPhone}</p>
      </div>

      <div className="flex border-b overflow-x-auto">
        {['info', 'media', 'links', 'docs', 'appointments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 px-3 py-3 text-xs font-medium whitespace-nowrap ${
              activeTab === tab ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'
            }`}
          >
            {tab === 'info' && 'Info'}
            {tab === 'media' && 'Mídia'}
            {tab === 'links' && 'Links'}
            {tab === 'docs' && 'Docs'}
            {tab === 'appointments' && 'Agenda'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'info' && contact?.id && (
          <ContactTagsProducts
            contactId={contact.id}
            contactPhone={contactPhone}
          />
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowAppointmentForm(!showAppointmentForm)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </button>

            {showAppointmentForm && (
              <form onSubmit={handleCreateAppointment} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <input
                  required
                  placeholder="Título"
                  value={appointmentData.title}
                  onChange={(e) => setAppointmentData({ ...appointmentData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <select
                  value={appointmentData.appointmentType}
                  onChange={(e) => setAppointmentData({ ...appointmentData, appointmentType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="meeting">Reunião</option>
                  <option value="consultation">Consulta</option>
                  <option value="call">Ligação</option>
                </select>
                <input
                  required
                  type="datetime-local"
                  value={appointmentData.startTime}
                  onChange={(e) => setAppointmentData({ ...appointmentData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  required
                  type="datetime-local"
                  value={appointmentData.endTime}
                  onChange={(e) => setAppointmentData({ ...appointmentData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  placeholder="Local"
                  value={appointmentData.location}
                  onChange={(e) => setAppointmentData({ ...appointmentData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <textarea
                  placeholder="Observações"
                  value={appointmentData.notes}
                  onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAppointmentForm(false)} className="flex-1 px-3 py-2 border rounded-lg text-sm">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm">
                    Criar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {appointmentsData?.map((apt: any) => (
                <div key={apt.id} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm">{apt.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(apt.start_time)}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                    apt.status === 'scheduled' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              )) || <p className="text-sm text-gray-500 text-center py-4">Nenhum agendamento</p>}
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-4">
            {mediaData?.images?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Imagens ({mediaData.images.length})</h4>
                <div className="grid grid-cols-3 gap-2">
                  {mediaData.images.map((media: any) => (
                    <a key={media.id} href={media.url} target="_blank" rel="noopener noreferrer">
                      <img src={media.url} alt="" className="w-full aspect-square object-cover rounded" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {!mediaData?.images?.length && <p className="text-sm text-gray-500 text-center py-4">Nenhuma mídia</p>}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-2">
            {mediaData?.links?.map((link: any) => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100">
                <LinkIcon className="w-4 h-4" />
                <span className="text-sm text-blue-600 truncate">{link.url}</span>
              </a>
            )) || <p className="text-sm text-gray-500 text-center py-4">Nenhum link</p>}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-2">
            {mediaData?.documents?.map((doc: any) => (
              <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100">
                <FileText className="w-4 h-4" />
                <span className="text-sm truncate">{doc.caption || 'Documento'}</span>
              </a>
            )) || <p className="text-sm text-gray-500 text-center py-4">Nenhum documento</p>}
          </div>
        )}
      </div>
    </div>
  )
}
