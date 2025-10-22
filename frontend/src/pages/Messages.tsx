import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { messagesAPI } from '../services/api'
import { Message } from '../types'
import { formatDateTime } from '../lib/utils'

export default function Messages() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()

  const { data: messages } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await messagesAPI.getAll()
      return res.data.data
    },
  })

  const sendMutation = useMutation({
    mutationFn: (data: { to: string; message: string }) => messagesAPI.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      toast.success('Mensagem enviada!')
      setPhone('')
      setMessage('')
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  })

  const handleSend = () => {
    if (!phone || !message) {
      toast.error('Preencha todos os campos')
      return
    }
    sendMutation.mutate({ to: phone, message })
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300',
    sent: 'bg-blue-500/20 text-blue-300',
    delivered: 'bg-green-500/20 text-green-300',
    read: 'bg-green-600/20 text-green-400',
    failed: 'bg-red-500/20 text-red-300',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Mensagens</h1>
        <p className="text-clinic-gray-300">Envio individual de mensagens</p>
      </div>

      <Card className="border-none bg-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Enviar Mensagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Telefone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5547999999999"
              className="bg-white/20 text-white placeholder:text-clinic-gray-400"
            />
            <div>
              <label className="block text-sm font-medium text-white mb-1">Mensagem</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={4}
                className="w-full rounded-lg border border-clinic-gray-300 bg-white/20 text-white px-3 py-2 placeholder:text-clinic-gray-400 focus:outline-none focus:ring-2 focus:ring-clinic-royal"
              />
            </div>
            <Button onClick={handleSend} disabled={sendMutation.isPending}>
              <Send size={18} className="mr-2" />
              {sendMutation.isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {messages?.map((msg: Message) => (
              <div
                key={msg.id}
                className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-white">{msg.phone}</p>
                    <p className="text-sm text-clinic-gray-400">{formatDateTime(msg.created_at)}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${statusColors[msg.status]}`}>
                    {msg.status}
                  </span>
                </div>
                <p className="text-clinic-gray-300 text-sm">{msg.message}</p>
              </div>
            ))}
            {!messages?.length && (
              <p className="text-center text-clinic-gray-400 py-8">
                Nenhuma mensagem enviada ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
