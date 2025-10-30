import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, Paperclip, Image, X, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { messagesAPI } from '../services/api'
import { Message } from '../types'
import { formatDateTime } from '../lib/utils'
import axios from 'axios'

export default function Messages() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const { data: messages, isLoading, refetch } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await messagesAPI.getAll()
      return res.data.data
    },
  })

  const sendMutation = useMutation({
    mutationFn: (data: { to: string; message: string; mediaUrl?: string }) =>
      messagesAPI.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      toast.success('Mensagem enviada!')
      resetForm()
    },
    onError: (error: any) => {
      console.error('Send error:', error)
      toast.error(error?.response?.data?.message || 'Erro ao enviar mensagem')
    },
  })

  const resetForm = () => {
    setPhone('')
    setMessage('')
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (max 16MB for WhatsApp)
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 16MB')
      return
    }

    // Validate file type
    const validTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado')
      return
    }

    setSelectedFile(file)

    // Create preview for images and videos
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploading(true)
      const response = await axios.post('/api/upload/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      return response.data.data.url || response.data.data.path
    } catch (error: any) {
      console.error('Upload error:', error)
      throw new Error(error?.response?.data?.message || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const handleSend = async () => {
    // Validate inputs
    if (!phone) {
      toast.error('Digite o telefone')
      return
    }

    if (!message && !selectedFile) {
      toast.error('Digite uma mensagem ou selecione um arquivo')
      return
    }

    try {
      let mediaUrl: string | undefined

      // Upload file if selected
      if (selectedFile) {
        toast.loading('Fazendo upload...', { id: 'upload' })
        mediaUrl = await uploadFile(selectedFile)
        toast.success('Upload concluído!', { id: 'upload' })
      }

      // Send message
      sendMutation.mutate({
        to: phone,
        message: message || (selectedFile ? `[${selectedFile.name}]` : ''),
        mediaUrl
      })
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar', { id: 'upload' })
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300',
    sent: 'bg-blue-500/20 text-blue-300',
    delivered: 'bg-green-500/20 text-green-300',
    read: 'bg-green-600/20 text-green-400',
    failed: 'bg-red-500/20 text-red-300',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    sent: 'Enviado',
    delivered: 'Entregue',
    read: 'Lido',
    failed: 'Falhou',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mensagens</h1>
          <p className="text-clinic-gray-300">Envio individual de mensagens e mídia</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <Card className="border-none bg-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Enviar Mensagem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Telefone (com DDI)"
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

            {/* File Preview */}
            {selectedFile && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} className="text-clinic-gray-400" />
                    <span className="text-white text-sm font-medium">
                      {selectedFile.name}
                    </span>
                    <span className="text-clinic-gray-400 text-xs">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={16} />
                  </button>
                </div>

                {previewUrl && (
                  <div className="mt-2">
                    {selectedFile.type.startsWith('image/') && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-48 rounded-lg"
                      />
                    )}
                    {selectedFile.type.startsWith('video/') && (
                      <video
                        src={previewUrl}
                        controls
                        className="max-h-48 rounded-lg"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div>
                  <Button variant="outline" type="button">
                    <Paperclip size={18} className="mr-2" />
                    Anexar Arquivo
                  </Button>
                </div>
              </label>

              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending || uploading}
                className="flex-1"
              >
                <Send size={18} className="mr-2" />
                {uploading ? 'Fazendo Upload...' : sendMutation.isPending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>

            <p className="text-xs text-clinic-gray-400">
              Formatos aceitos: Imagens (JPG, PNG, GIF, WebP), Vídeos (MP4, AVI, MOV), Documentos (PDF, DOC, XLS). Tamanho máximo: 16MB
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-white/10 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Envios</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-white" size={32} />
            </div>
          ) : (
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
                      {statusLabels[msg.status] || msg.status}
                    </span>
                  </div>

                  <p className="text-clinic-gray-300 text-sm mb-2">{msg.message}</p>

                  {msg.media_url && (
                    <div className="mt-2 flex items-center gap-2 text-blue-400 text-sm">
                      {msg.media_type?.startsWith('image') && <Image size={14} />}
                      {msg.media_type?.startsWith('video') && <span>🎬</span>}
                      {msg.media_type?.startsWith('application') && <span>📄</span>}
                      <span>Mídia anexada</span>
                    </div>
                  )}
                </div>
              ))}
              {!messages?.length && (
                <p className="text-center text-clinic-gray-400 py-8">
                  Nenhuma mensagem enviada ainda
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
