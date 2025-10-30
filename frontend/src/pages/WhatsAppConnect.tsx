import { useState, useEffect, useRef } from 'react'
import { whatsappAPI } from '../services/api'
import { toast } from 'sonner'
import { QrCode, Smartphone, Trash2, RefreshCw, Plus, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function WhatsAppConnect() {
  console.log('🟢 WhatsAppConnect component loaded')

  const [instances, setInstances] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newInstanceName, setNewInstanceName] = useState('')
  const [showNewInstanceModal, setShowNewInstanceModal] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [selectedInstanceName, setSelectedInstanceName] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string>('waiting')
  const [pollingAttempts, setPollingAttempts] = useState(0)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    console.log('🟢 WhatsAppConnect useEffect - carregando instâncias')
    loadInstances()
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const loadInstances = async () => {
    try {
      setLoading(true)
      const response = await whatsappAPI.getAllInstances()
      const instancesList = response.data.data || []
      setInstances(instancesList)

      // Only show toast on manual refresh (not initial load)
      if (instances.length > 0) {
        toast.success(`${instancesList.length} instância(s) atualizada(s)`)
      }
    } catch (error: any) {
      console.error('Erro ao carregar instâncias:', error)
      toast.error(error.response?.data?.message || 'Erro ao carregar instâncias')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInstance = async () => {
    console.log('🎯 handleCreateInstance CHAMADO')
    const trimmedName = newInstanceName.trim()
    console.log('📝 Nome da instância:', trimmedName)

    if (!trimmedName) {
      console.warn('⚠️ Nome vazio')
      toast.error('Digite um nome para a instância')
      return
    }

    try {
      setLoading(true)
      console.log('🚀 Chamando API para criar instância:', trimmedName)
      const response = await whatsappAPI.createInstance(trimmedName)
      console.log('✅ Resposta da API:', response)

      // Se o QR Code já veio na resposta, mostrar imediatamente
      if (response.data.data?.qrcode?.base64) {
        console.log('✅ QR Code recebido imediatamente da criação!')
        setSelectedInstanceName(trimmedName)
        setQrCode(response.data.data.qrcode.base64)
        setQrLoading(false)
      }

      toast.success('Instância criada com sucesso!')
      setShowNewInstanceModal(false)
      setNewInstanceName('')
      await loadInstances()
    } catch (error: any) {
      console.error('❌ ERRO ao criar instância:', error)
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      const errorMsg = error.response?.data?.response?.message?.[0] || error.response?.data?.message || 'Erro ao criar instância'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
      console.log('🏁 handleCreateInstance FINALIZADO')
    }
  }

  const pollForQRCode = async (instanceName: string, attempts = 0) => {
    setPollingAttempts(attempts + 1)

    if (attempts >= 30) {
      setQrLoading(false)
      setConnectionStatus('timeout')
      toast.error('Tempo limite excedido. Tente novamente.')
      return
    }

    try {
      // Check instance status first
      const statusResponse = await whatsappAPI.getInstanceStatus(instanceName)
      const status = statusResponse.data.data?.instance?.state || statusResponse.data.data?.connectionStatus

      if (status === 'open' || status === 'connected') {
        setConnectionStatus('connected')
        setQrLoading(false)
        toast.success('WhatsApp conectado com sucesso!')
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        setTimeout(() => {
          closeQRModal()
        }, 2000)
        return
      }

      const response = await whatsappAPI.getQRCode(instanceName)
      const qrData = response.data.data

      // Verificar se tem QR code em base64
      if (qrData?.qrcode?.base64) {
        setQrCode(qrData.qrcode.base64)
        setQrLoading(false)
        setConnectionStatus('qr_ready')
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        return
      }

      // Verificar se tem QR code em texto
      if (qrData?.qrcode?.code) {
        setQrCode(qrData.qrcode.code)
        setQrLoading(false)
        setConnectionStatus('qr_ready')
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        return
      }

      // Se ainda não tem QR code, continuar polling
      console.log(`Tentativa ${attempts + 1}: QR Code ainda não disponível`)
      setConnectionStatus('generating')
    } catch (error: any) {
      console.error('Erro ao buscar QR Code:', error)
      if (attempts > 5) {
        setConnectionStatus('error')
      }
    }
  }

  const handleGetQRCode = async (instanceName: string) => {
    console.log('🔵 handleGetQRCode chamado para:', instanceName)

    try {
      setSelectedInstanceName(instanceName)
      setQrLoading(true)
      setQrCode(null)
      setConnectionStatus('connecting')
      setPollingAttempts(0)

      console.log('🔵 Chamando connectInstance...')
      // Chamar endpoint de conexão que já faz tudo
      const response = await whatsappAPI.connectInstance(instanceName)
      console.log('🔵 Resposta do connectInstance:', response)

      // Aguardar um pouco para a Evolution processar
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Primeira tentativa imediata de buscar QR Code
      await pollForQRCode(instanceName, 0)

      // Iniciar polling a cada 2 segundos
      let attempts = 1
      pollingRef.current = setInterval(async () => {
        await pollForQRCode(instanceName, attempts)
        attempts++
      }, 2000)

    } catch (error: any) {
      console.error('❌ Erro ao gerar QR Code:', error)
      toast.error(error.response?.data?.message || 'Erro ao gerar QR Code')
      setQrLoading(false)
      setConnectionStatus('error')
    }
  }

  const handleConfirmPhone = async () => {
    // Função mantida para compatibilidade, mas não é mais usada
    return
  }


  const handleDelete = async (instanceName: string) => {
    if (!confirm('Deseja realmente excluir esta instância? Esta ação não pode ser desfeita.')) return

    try {
      setLoading(true)
      await whatsappAPI.deleteInstance(instanceName)
      toast.success('Instância excluída!')
      await loadInstances()
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast.error(error.response?.data?.message || 'Erro ao excluir instância')
    } finally {
      setLoading(false)
    }
  }

  const closeQRModal = () => {
    setQrCode(null)
    setQrLoading(false)
    setSelectedInstanceName(null)
    setConnectionStatus('waiting')
    setPollingAttempts(0)
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    loadInstances()
  }

  const getStatusIcon = (status: string) => {
    if (status === 'open' || status === 'connected') return <CheckCircle2 className="w-5 h-5 text-green-500" />
    if (status === 'connecting') return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
    if (status === 'close') return <XCircle className="w-5 h-5 text-red-500" />
    return <AlertCircle className="w-5 h-5 text-gray-500" />
  }

  const getStatusText = (status: string) => {
    if (status === 'open' || status === 'connected') return 'Conectado'
    if (status === 'connecting') return 'Conectando...'
    if (status === 'close') return 'Desconectado'
    return 'Desconhecido'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0038A8] to-[#006B7D] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Conexões WhatsApp</h1>
            <p className="text-gray-300">Gerencie suas instâncias WhatsApp conectadas</p>
            {instances.length > 0 && (
              <p className="text-gray-400 text-sm mt-1">{instances.length} instância(s) configurada(s)</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadInstances}
              disabled={loading}
              className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition flex items-center gap-2 disabled:opacity-50 border border-white/30"
              title="Atualizar status das instâncias"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => setShowNewInstanceModal(true)}
              disabled={loading}
              className="bg-white text-[#0038A8] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              Nova Instância
            </button>
          </div>
        </div>

        {/* Instances Grid */}
        {loading && instances.length === 0 ? (
          <div className="text-center text-white py-12">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p>Carregando instâncias...</p>
          </div>
        ) : instances.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center">
            <Smartphone className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma instância encontrada</h3>
            <p className="text-gray-300 mb-6">Crie sua primeira instância para começar a enviar mensagens</p>
            <button
              onClick={() => setShowNewInstanceModal(true)}
              className="bg-white text-[#0038A8] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Criar Primeira Instância
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map((instance: any) => {
              // Tentar múltiplas fontes para o nome da instância
              const instanceName = instance.instance_name || instance.name || instance.instance?.instanceName || instance.instanceName
              const status = instance.connectionStatus || instance.instance?.status || instance.status || 'unknown'

              // Se não conseguiu extrair o nome, pular esta instância
              if (!instanceName) {
                console.warn('⚠️ Instância sem nome:', instance)
                return null
              }

              return (
                <div
                  key={instanceName}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{instanceName}</h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="text-sm text-gray-300">{getStatusText(status)}</span>
                      </div>
                      {instance.instance?.profileName && (
                        <p className="text-xs text-gray-400 mt-1">📱 {instance.instance.profileName}</p>
                      )}
                      {instance.instance?.number && (
                        <p className="text-xs text-gray-400">📞 {instance.instance.number}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGetQRCode(instanceName)}
                      className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center justify-center gap-2 text-sm"
                      disabled={loading || qrLoading}
                    >
                      <QrCode className="w-4 h-4" />
                      {qrLoading && selectedInstanceName === instanceName ? 'Gerando...' : 'Conectar'}
                    </button>
                    <button
                      onClick={() => handleDelete(instanceName)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                      disabled={loading}
                      title="Excluir instância"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* New Instance Modal */}
        {showNewInstanceModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nova Instância WhatsApp</h2>
              <p className="text-gray-600 mb-6">Digite um nome único para identificar esta conexão</p>

              <input
                type="text"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="Ex: whatsapp-principal"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0038A8] focus:border-transparent mb-6"
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleCreateInstance()
                  }
                }}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewInstanceModal(false)
                    setNewInstanceName('')
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    console.log('🔴 BOTÃO CRIAR CLICADO!')
                    handleCreateInstance()
                  }}
                  className="flex-1 bg-[#0038A8] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#002870] transition disabled:opacity-50"
                  disabled={loading || !newInstanceName.trim()}
                >
                  {loading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phone Number Modal */}
        {showPhoneModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Número do WhatsApp</h2>
              <p className="text-gray-600 mb-6">Digite o número de telefone que será conectado (com DDI e DDD)</p>

              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 5547999999999"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0038A8] focus:border-transparent mb-6"
                maxLength={15}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmPhone()
                  }
                }}
              />

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Formato:</strong> Digite apenas números<br />
                  Exemplo: 5547999999999 (Brasil: 55 + DDD + número)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPhoneModal(false)
                    setPhoneNumber('')
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmPhone}
                  className="flex-1 bg-[#0038A8] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#002870] transition disabled:opacity-50"
                  disabled={!phoneNumber.trim() || phoneNumber.length < 10}
                >
                  Conectar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {(qrCode || qrLoading) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Conectar WhatsApp</h2>

              {/* Status Badge */}
              <div className="mb-6">
                {connectionStatus === 'connecting' && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span>Iniciando conexão...</span>
                  </div>
                )}
                {connectionStatus === 'generating' && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gerando QR Code... (tentativa {pollingAttempts}/30)</span>
                  </div>
                )}
                {connectionStatus === 'qr_ready' && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <QrCode className="w-4 h-4" />
                    <span>QR Code pronto! Escaneie agora</span>
                  </div>
                )}
                {connectionStatus === 'connected' && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conectado com sucesso!</span>
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <XCircle className="w-4 h-4" />
                    <span>Erro ao conectar. Tente novamente.</span>
                  </div>
                )}
                {connectionStatus === 'timeout' && (
                  <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>Tempo limite excedido</span>
                  </div>
                )}
              </div>

              {qrLoading && !qrCode ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 animate-spin text-[#0038A8] mx-auto mb-4" />
                  <p className="text-gray-600">Aguardando QR Code...</p>
                  <p className="text-sm text-gray-500 mt-2">Isto pode levar alguns segundos</p>
                </div>
              ) : connectionStatus === 'connected' ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-900 font-semibold text-lg">WhatsApp conectado!</p>
                  <p className="text-sm text-gray-500 mt-2">Fechando automaticamente...</p>
                </div>
              ) : qrCode ? (
                <>
                  <p className="text-gray-600 mb-6">
                    Abra o WhatsApp no seu celular e escaneie o QR Code abaixo:
                  </p>

                  <div className="bg-white p-4 rounded-xl border-2 border-gray-200 mb-6 flex justify-center">
                    {qrCode.startsWith('data:image') || qrCode.startsWith('http') ? (
                      <img src={qrCode} alt="QR Code" className="w-full max-w-sm" />
                    ) : (
                      <QRCodeSVG
                        value={qrCode}
                        size={256}
                        level="M"
                        includeMargin={true}
                      />
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>Como escanear:</strong><br />
                      1. Abra o WhatsApp<br />
                      2. Vá em Configurações → Aparelhos conectados<br />
                      3. Toque em "Conectar um aparelho"<br />
                      4. Aponte a câmera para este QR Code
                    </p>
                  </div>
                </>
              ) : null}

              <button
                onClick={closeQRModal}
                className="w-full bg-[#0038A8] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#002870] transition disabled:opacity-50"
                disabled={connectionStatus === 'connected'}
              >
                {connectionStatus === 'connected' ? 'Fechando...' : qrLoading && !qrCode ? 'Cancelar' : 'Fechar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
