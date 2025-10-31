import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Trash2, Send } from 'lucide-react'
import { toast } from 'sonner'

interface AudioRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
}

export default function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('Erro ao acessar microfone')
    }
  }

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Armazena a duração atual antes de parar
      const currentDuration = duration

      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Aguarda o blob ser criado e envia automaticamente
      setTimeout(() => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
          onSend(blob, currentDuration)
          cleanup()
        }
      }, 100)
    }
  }

  const handleCancel = () => {
    cleanup()
    onCancel()
  }

  const cleanup = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white border-t px-6 py-4">
      <div className="flex items-center gap-3">
        {!isRecording && !audioBlob && (
          <>
            <button
              onClick={startRecording}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Iniciar gravação"
            >
              <Mic className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-500">Clique para gravar áudio</span>
            <button
              onClick={handleCancel}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </>
        )}

        {isRecording && (
          <>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-900">
                Gravando... {formatDuration(duration)}
              </span>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors mr-2"
              title="Cancelar"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={stopRecordingAndSend}
              className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              title="Parar e enviar áudio"
            >
              <Square className="w-4 h-4" />
              <Send className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
