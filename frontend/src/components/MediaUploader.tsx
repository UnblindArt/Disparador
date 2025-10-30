import { useRef, useState } from 'react'
import { Image, Video, FileText, X, Send, Paperclip } from 'lucide-react'
import { toast } from 'sonner'

interface MediaUploaderProps {
  onSend: (file: File, caption: string, mediaType: string) => Promise<void>
  onCancel: () => void
}

export default function MediaUploader({ onSend, onCancel }: MediaUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [mediaType, setMediaType] = useState<string>('image')
  const [isSending, setIsSending] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 100MB')
      return
    }

    setSelectedFile(file)

    // Determine media type
    if (file.type.startsWith('image/')) {
      setMediaType('image')
      setPreviewUrl(URL.createObjectURL(file))
    } else if (file.type.startsWith('video/')) {
      setMediaType('video')
      setPreviewUrl(URL.createObjectURL(file))
    } else if (file.type.startsWith('audio/')) {
      setMediaType('audio')
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setMediaType('document')
      setPreviewUrl(null)
    }
  }

  const handleSend = async () => {
    if (selectedFile) {
      setIsSending(true)
      setUploadProgress(0)

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)

        await onSend(selectedFile, caption, mediaType)

        clearInterval(progressInterval)
        setUploadProgress(100)

        // Wait a bit to show 100% before cleanup
        setTimeout(() => {
          cleanup()
        }, 500)
      } catch (error) {
        setIsSending(false)
        setUploadProgress(0)
      }
    }
  }

  const cleanup = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCancel = () => {
    cleanup()
    onCancel()
  }

  if (!selectedFile) {
    return (
      <div className="bg-white border-t px-6 py-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
            Selecionar arquivo
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/*'
                  fileInputRef.current.click()
                }
              }}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              title="Foto"
            >
              <Image className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'video/*'
                  fileInputRef.current.click()
                }
              }}
              className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
              title="Vídeo"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
                  fileInputRef.current.click()
                }
              }}
              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
              title="Documento"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleCancel}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-t">
      {/* Preview */}
      <div className="px-6 py-4 border-b max-h-96 overflow-auto">
        {mediaType === 'image' && previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-80 mx-auto rounded-lg"
          />
        )}
        {mediaType === 'video' && previewUrl && (
          <video
            src={previewUrl}
            controls
            className="max-h-80 mx-auto rounded-lg"
          />
        )}
        {mediaType === 'audio' && previewUrl && (
          <div className="flex flex-col items-center gap-3 p-6">
            <div className="text-gray-700 font-medium">{selectedFile.name}</div>
            <audio src={previewUrl} controls className="w-full max-w-md" />
          </div>
        )}
        {mediaType === 'document' && (
          <div className="flex items-center gap-3 p-6 bg-gray-50 rounded-lg">
            <FileText className="w-12 h-12 text-gray-400" />
            <div>
              <div className="font-medium text-gray-900">{selectedFile.name}</div>
              <div className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Caption and actions */}
      <div className="px-6 py-4">
        {/* Upload Progress Bar */}
        {isSending && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {uploadProgress < 100 ? 'Enviando...' : 'Enviado!'}
              </span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  uploadProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-end gap-3">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Adicionar legenda..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isSending}
          />
          <button
            onClick={cleanup}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remover arquivo"
            disabled={isSending}
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enviar"
            disabled={isSending}
          >
            <Send className={`w-5 h-5 ${isSending ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
