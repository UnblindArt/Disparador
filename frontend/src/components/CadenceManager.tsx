import { Plus, X, Image as ImageIcon, Clock, Trash2 } from 'lucide-react'
import type { CadenceMedia } from '../services/api'

interface CadenceDay {
  day_number: number
  message: string
  send_time: string
  media: CadenceMedia[]
}

interface CadenceManagerProps {
  cadences: CadenceDay[]
  onChange: (cadences: CadenceDay[]) => void
}

export default function CadenceManager({ cadences, onChange }: CadenceManagerProps) {
  const addDay = () => {
    const newDay: CadenceDay = {
      day_number: cadences.length + 1,
      message: '',
      send_time: '09:00',
      media: []
    }
    onChange([...cadences, newDay])
  }

  const removeDay = (index: number) => {
    const updated = cadences.filter((_, i) => i !== index)
    // Renumerar dias
    updated.forEach((day, i) => {
      day.day_number = i + 1
    })
    onChange(updated)
  }

  const updateDay = (index: number, field: keyof CadenceDay, value: any) => {
    const updated = [...cadences]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const addMedia = (dayIndex: number) => {
    const updated = [...cadences]
    updated[dayIndex].media.push({
      media_url: '',
      media_type: 'image',
      caption: '',
      display_order: updated[dayIndex].media.length
    })
    onChange(updated)
  }

  const removeMedia = (dayIndex: number, mediaIndex: number) => {
    const updated = [...cadences]
    updated[dayIndex].media = updated[dayIndex].media.filter((_, i) => i !== mediaIndex)
    // Renumerar display_order
    updated[dayIndex].media.forEach((m, i) => {
      m.display_order = i
    })
    onChange(updated)
  }

  const updateMedia = (dayIndex: number, mediaIndex: number, field: keyof CadenceMedia, value: any) => {
    const updated = [...cadences]
    updated[dayIndex].media[mediaIndex] = {
      ...updated[dayIndex].media[mediaIndex],
      [field]: value
    }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Cadências (Sequência de Mensagens)</h3>
        <button
          type="button"
          onClick={addDay}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <Plus size={14} />
          Adicionar Dia
        </button>
      </div>

      {cadences.length === 0 && (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
          <p className="text-sm text-clinic-gray-400">
            Nenhuma cadência configurada. Clique em "Adicionar Dia" para criar.
          </p>
        </div>
      )}

      {cadences.map((day, dayIndex) => (
        <div key={dayIndex} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">Dia {day.day_number}</h4>
            <button
              type="button"
              onClick={() => removeDay(dayIndex)}
              className="p-1 text-red-400 hover:bg-red-500/20 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Horário de Envio */}
          <div>
            <label className="block text-xs text-clinic-gray-400 mb-1 flex items-center gap-1">
              <Clock size={12} />
              Horário de Envio
            </label>
            <input
              type="time"
              value={day.send_time}
              onChange={(e) => updateDay(dayIndex, 'send_time', e.target.value)}
              className="w-full px-3 py-2 bg-white/20 text-white border border-clinic-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-royal"
            />
          </div>

          {/* Mensagem */}
          <div>
            <label className="block text-xs text-clinic-gray-400 mb-1">Mensagem</label>
            <textarea
              value={day.message}
              onChange={(e) => updateDay(dayIndex, 'message', e.target.value)}
              placeholder="Digite a mensagem para este dia..."
              rows={3}
              className="w-full rounded-lg border border-clinic-gray-300 bg-white/20 text-white px-3 py-2 placeholder:text-clinic-gray-400 focus:outline-none focus:ring-2 focus:ring-clinic-royal"
            />
          </div>

          {/* Mídias */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-clinic-gray-400 flex items-center gap-1">
                <ImageIcon size={12} />
                Anexos (Opcional)
              </label>
              <button
                type="button"
                onClick={() => addMedia(dayIndex)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + Adicionar Mídia
              </button>
            </div>

            {day.media.map((media, mediaIndex) => (
              <div key={mediaIndex} className="p-2 rounded bg-white/10 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-clinic-gray-400">Mídia {mediaIndex + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeMedia(dayIndex, mediaIndex)}
                    className="p-0.5 text-red-400 hover:bg-red-500/20 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-clinic-gray-400 mb-1">Tipo</label>
                    <select
                      value={media.media_type}
                      onChange={(e) => updateMedia(dayIndex, mediaIndex, 'media_type', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white/20 text-white border border-clinic-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-clinic-royal"
                    >
                      <option value="image" className="bg-clinic-black">Imagem</option>
                      <option value="video" className="bg-clinic-black">Vídeo</option>
                      <option value="audio" className="bg-clinic-black">Áudio</option>
                      <option value="document" className="bg-clinic-black">Documento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-clinic-gray-400 mb-1">URL</label>
                    <input
                      type="url"
                      value={media.media_url}
                      onChange={(e) => updateMedia(dayIndex, mediaIndex, 'media_url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2 py-1.5 text-sm bg-white/20 text-white border border-clinic-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-clinic-royal placeholder:text-clinic-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-clinic-gray-400 mb-1">Legenda (Opcional)</label>
                  <input
                    type="text"
                    value={media.caption || ''}
                    onChange={(e) => updateMedia(dayIndex, mediaIndex, 'caption', e.target.value)}
                    placeholder="Legenda da mídia..."
                    className="w-full px-2 py-1.5 text-sm bg-white/20 text-white border border-clinic-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-clinic-royal placeholder:text-clinic-gray-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
