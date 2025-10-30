import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, RefreshCw, MessageSquare, Phone, ArrowLeft, Mic, Paperclip, Info, Bell, BellOff } from 'lucide-react'
import { chatAPI, contactsAPI, whatsappAPI, type ChatMessage, type WhatsAppChat } from '../services/api'
import AudioRecorder from '../components/AudioRecorder'
import MediaUploader from '../components/MediaUploader'
import EmojiPicker from '../components/EmojiPicker'
import ContactProfile from '../components/ContactProfile'

export default function Chat() {
  const queryClient = useQueryClient()
  const [selectedInstance, setSelectedInstance] = useState<string>('')
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [showMediaUploader, setShowMediaUploader] = useState(false)
  const [showContactProfile, setShowContactProfile] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  // Get all instances
  const { data: instancesData } = useQuery({
    queryKey: ['whatsapp-instances'],
    queryFn: async () => {
      const res = await whatsappAPI.getAllInstances()
      return res.data.data
    },
  })

  // Get WhatsApp chats for selected instance
  const { data: chatsData, isLoading: chatsLoading, refetch: refetchChats } = useQuery<WhatsAppChat[]>({
    queryKey: ['whatsapp-chats', selectedInstance],
    queryFn: async () => {
      if (!selectedInstance) return []
      const res = await contactsAPI.getWhatsAppChats(selectedInstance)
      return res.data.data
    },
    enabled: !!selectedInstance,
    refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh every 10s
  })

  // Handle notifications for unread messages
  useEffect(() => {
    if (chatsData && chatsData.length > 0) {
      const unreadCount = chatsData.reduce((acc: number, chat: WhatsAppChat) => acc + (chat.unreadCount || 0), 0)
      if (unreadCount > 0 && !document.hasFocus()) {
        // Browser notification (if permitted)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('WhatsApp Dispatcher', {
            body: `Você tem ${unreadCount} mensagem(ns) não lida(s)`,
            icon: '/favicon.ico',
          })
        }
      }
    }
  }, [chatsData])

  // Get conversation messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedInstance, selectedChat?.phone],
    queryFn: async () => {
      if (!selectedInstance || !selectedChat) return null
      const res = await chatAPI.getConversation(selectedInstance, selectedChat.phone)
      return res.data.data
    },
    enabled: !!selectedInstance && !!selectedChat,
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5s
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedInstance || !selectedChat) throw new Error('No chat selected')
      return chatAPI.sendMessage(selectedInstance, selectedChat.phone, {
        message,
        messageType: 'text'
      })
    },
    onSuccess: () => {
      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedInstance, selectedChat?.phone] })
      toast.success('Mensagem enviada!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar mensagem')
    },
  })

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData])

  // Select first instance by default
  useEffect(() => {
    if (instancesData && instancesData.length > 0 && !selectedInstance) {
      const firstInstance = instancesData[0] as any
      setSelectedInstance(firstInstance.instance_name || firstInstance.instance?.instanceName)
    }
  }, [instancesData, selectedInstance])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    sendMessageMutation.mutate(newMessage)
  }

  // Handle typing indicator
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    // Simulate typing indicator (in a real app, this would send to server)
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true)
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set typing to false after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 2000)
  }

  // Send audio message
  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    if (!selectedChat || !selectedInstance) return

    try {
      // Upload audio file first
      const formData = new FormData()
      formData.append('file', audioBlob, `audio-${Date.now()}.webm`)

      const uploadResponse = await fetch('https://dev-disparador.unblind.cloud/api/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!uploadResponse.ok) throw new Error('Erro ao fazer upload do áudio')

      const uploadData = await uploadResponse.json()
      const audioUrl = uploadData.url

      // Send audio message
      await chatAPI.sendMessage(selectedInstance, selectedChat.phone, {
        messageType: 'audio',
        audioUrl,
        message: `[Áudio ${Math.floor(duration)}s]`
      })

      toast.success('Áudio enviado!')
      setShowAudioRecorder(false)
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedInstance, selectedChat.phone] })
    } catch (error) {
      console.error('Error sending audio:', error)
      toast.error('Erro ao enviar áudio')
    }
  }

  // Send media message
  const handleSendMedia = async (file: File, caption: string, mediaType: string) => {
    if (!selectedChat || !selectedInstance) return

    try {
      // Upload media file first
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('https://dev-disparador.unblind.cloud/api/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!uploadResponse.ok) throw new Error('Erro ao fazer upload do arquivo')

      const uploadData = await uploadResponse.json()
      const mediaUrl = uploadData.url

      // Send media message
      await chatAPI.sendMessage(selectedInstance, selectedChat.phone, {
        messageType: 'media',
        mediaUrl,
        mediaType,
        message: caption
      })

      toast.success('Mídia enviada!')
      setShowMediaUploader(false)
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedInstance, selectedChat.phone] })
    } catch (error) {
      console.error('Error sending media:', error)
      toast.error('Erro ao enviar mídia')
    }
  }

  // Insert emoji at cursor position
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    textInputRef.current?.focus()
  }

  // Request notification permission
  const handleRequestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
      if (permission === 'granted') {
        toast.success('Notificações ativadas!')
      } else {
        toast.error('Notificações negadas')
      }
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
            <p className="text-sm text-gray-600 mt-1">Conversas do WhatsApp</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Instance selector */}
            <select
              value={selectedInstance}
              onChange={(e) => {
                setSelectedInstance(e.target.value)
                setSelectedChat(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Selecione uma instância</option>
              {instancesData?.map((instance: any) => {
                const instanceName = instance.instance_name || instance.instance?.instanceName
                return (
                  <option key={instance.id || instanceName} value={instanceName}>
                    {instanceName}
                  </option>
                )
              })}
            </select>

            {/* Notifications toggle */}
            {('Notification' in window) && (
              <button
                onClick={handleRequestNotifications}
                className={`p-2 rounded-lg transition-colors ${
                  notificationsEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
                title={notificationsEnabled ? 'Notificações ativadas' : 'Ativar notificações'}
              >
                {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
            )}

            {/* Auto-refresh toggle */}
            <button
              onClick={() => {
                setAutoRefresh(!autoRefresh)
                toast.success(autoRefresh ? 'Atualização automática desativada' : 'Atualização automática ativada')
              }}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
              title={autoRefresh ? 'Desativar atualização automática' : 'Ativar atualização automática'}
            >
              <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>

            {/* Manual refresh */}
            <button
              onClick={() => {
                refetchChats()
                toast.success('Conversas atualizadas!')
              }}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              title="Atualizar conversas"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversations list */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Conversas</h2>
            {chatsData && (
              <p className="text-xs text-gray-500 mt-1">{chatsData.length} conversas</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatsLoading ? (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Carregando conversas...</p>
              </div>
            ) : !selectedInstance ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Selecione uma instância</p>
              </div>
            ) : chatsData && chatsData.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="divide-y">
                {chatsData?.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                      selectedChat?.phone === chat.phone ? 'bg-green-50' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {chat.profilePicUrl ? (
                        <img src={chat.profilePicUrl} alt={chat.name} className="w-full h-full object-cover" />
                      ) : (
                        <Phone className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    {/* Chat info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                          {/* Tags - small colored badges */}
                          {(chat as any).tags && (chat as any).tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              {(chat as any).tags.slice(0, 2).map((tag: any) => (
                                <span
                                  key={tag.id}
                                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: tag.color }}
                                  title={tag.name}
                                />
                              ))}
                              {(chat as any).tags.length > 2 && (
                                <span className="text-xs text-gray-400" title={`+${(chat as any).tags.length - 2} tags`}>
                                  +{(chat as any).tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {chat.lastMessageTime && (
                            <span className="text-xs text-gray-400">
                              {formatTimestamp(new Date(chat.lastMessageTime).toISOString())}
                            </span>
                          )}
                          {chat.unreadCount > 0 && (
                            <span className="bg-green-500 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Preview da última mensagem */}
                      {chat.lastMessage?.text ? (
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage.fromMe && <span className="text-blue-600">Você: </span>}
                          {chat.lastMessage.text}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 truncate italic">Nenhuma mensagem</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">Selecione uma conversa</h3>
                <p className="text-sm">Escolha um contato para começar a conversar</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {selectedChat.profilePicUrl ? (
                    <img src={selectedChat.profilePicUrl} alt={selectedChat.name} className="w-full h-full object-cover" />
                  ) : (
                    <Phone className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{selectedChat.name}</h3>
                  {isTyping ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="flex gap-1">
                        <span className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                      digitando...
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">{selectedChat.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowContactProfile(!showContactProfile)}
                  className={`p-2 rounded-lg transition-colors ${
                    showContactProfile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Ver perfil do contato"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messagesLoading ? (
                  <div className="text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Carregando mensagens...</p>
                  </div>
                ) : messagesData && messagesData.messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-sm mt-1">Envie a primeira mensagem!</p>
                  </div>
                ) : (
                  messagesData?.messages.map((msg: ChatMessage) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg overflow-hidden ${
                          msg.direction === 'outbound'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-900 border'
                        }`}
                      >
                        {/* Media Content */}
                        {msg.mediaUrl && (
                          <div className="mb-2">
                            {/* Image */}
                            {msg.mediaType === 'image' && (
                              <img
                                src={msg.mediaUrl}
                                alt="Imagem"
                                className="w-full max-w-sm rounded cursor-pointer hover:opacity-90"
                                onClick={() => window.open(msg.mediaUrl, '_blank')}
                              />
                            )}

                            {/* Video */}
                            {msg.mediaType === 'video' && (
                              <video
                                src={msg.mediaUrl}
                                controls
                                className="w-full max-w-sm rounded"
                              />
                            )}

                            {/* Audio */}
                            {msg.mediaType === 'audio' && (
                              <div className="flex items-center gap-3 px-4 py-3 bg-black/10 rounded">
                                <audio src={msg.mediaUrl} controls className="flex-1" />
                              </div>
                            )}

                            {/* Document */}
                            {msg.mediaType === 'document' && (
                              <a
                                href={msg.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 px-4 py-3 rounded hover:bg-black/5 transition-colors ${
                                  msg.direction === 'outbound' ? 'bg-white/10' : 'bg-gray-50'
                                }`}
                              >
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">Documento</p>
                                  <p className={`text-xs ${msg.direction === 'outbound' ? 'text-green-100' : 'text-gray-500'}`}>
                                    Clique para baixar
                                  </p>
                                </div>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Text Message */}
                        {msg.message && (
                          <p className="text-sm whitespace-pre-wrap break-words px-4 py-2">
                            {msg.message}
                          </p>
                        )}

                        {/* Timestamp and Status */}
                        <div className={`flex items-center justify-end gap-1 px-4 pb-2 ${!msg.message && msg.mediaUrl ? 'pt-2' : ''}`}>
                          <p
                            className={`text-xs ${
                              msg.direction === 'outbound' ? 'text-green-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTimestamp(msg.timestamp)}
                          </p>
                          {/* Status checkmarks */}
                          {msg.direction === 'outbound' && (
                            <span className="ml-1">
                              {msg.status === 'sent' && (
                                <svg className="w-4 h-4 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                </svg>
                              )}
                              {msg.status === 'delivered' && (
                                <svg className="w-4 h-4 text-green-100" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                                </svg>
                              )}
                              {msg.status === 'read' && (
                                <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                                </svg>
                              )}
                              {msg.status === 'pending' && (
                                <svg className="w-4 h-4 text-green-100 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                                </svg>
                              )}
                              {msg.status === 'failed' && (
                                <svg className="w-4 h-4 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="bg-white border-t px-6 py-4">
                {showAudioRecorder ? (
                  <AudioRecorder
                    onSend={handleSendAudio}
                    onCancel={() => setShowAudioRecorder(false)}
                  />
                ) : showMediaUploader ? (
                  <MediaUploader
                    onSend={handleSendMedia}
                    onCancel={() => setShowMediaUploader(false)}
                  />
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    {/* Emoji Picker */}
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />

                    {/* Media Upload Button */}
                    <button
                      type="button"
                      onClick={() => setShowMediaUploader(true)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Enviar mídia"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Text Input */}
                    <input
                      ref={textInputRef}
                      type="text"
                      value={newMessage}
                      onChange={handleMessageChange}
                      placeholder="Digite uma mensagem..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={sendMessageMutation.isPending}
                    />

                    {/* Audio or Send Button */}
                    {!newMessage.trim() ? (
                      <button
                        type="button"
                        onClick={() => setShowAudioRecorder(true)}
                        className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Gravar áudio"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={sendMessageMutation.isPending}
                        className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    )}
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* Contact Profile Sidebar */}
        {showContactProfile && selectedChat && (
          <ContactProfile
            contactPhone={selectedChat.phone}
            contactName={selectedChat.name}
            onClose={() => setShowContactProfile(false)}
          />
        )}
      </div>
    </div>
  )
}
