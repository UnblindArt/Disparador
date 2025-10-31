import { useState } from 'react'
import { Plus, X, Clock, Calendar, Zap } from 'lucide-react'
import type { CadenceMedia } from '../services/api'

interface CadenceDay {
  day_number: number
  message: string
  send_time: string
  media: CadenceMedia[]
}

interface CadenceWizardProps {
  cadences: CadenceDay[]
  onChange: (cadences: CadenceDay[]) => void
}

export default function CadenceWizard({ cadences, onChange }: CadenceWizardProps) {
  const [intervalDays, setIntervalDays] = useState(1)
  const [totalDays, setTotalDays] = useState(cadences.length || 3)
  const [defaultTime, setDefaultTime] = useState('09:00')

  const createCadenceStructure = () => {
    const newCadences: CadenceDay[] = []

    for (let i = 1; i <= totalDays; i++) {
      newCadences.push({
        day_number: i,
        message: '',
        send_time: defaultTime,
        media: []
      })
    }

    onChange(newCadences)
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

  const removeDay = (index: number) => {
    const updated = cadences.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className="space-y-6">
      {/* Wizard: Step 1 - Configuration */}
      {cadences.length === 0 && (
        <div className="p-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Criar Cadência de Mensagens</h3>
              <p className="text-sm text-clinic-gray-400">Configure a sequência automática de mensagens</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Intervalo entre dias */}
            <div>
              <label className="block text-sm text-white mb-2 flex items-center gap-2">
                <Calendar size={14} />
                Intervalo (dias)
              </label>
              <select
                value={intervalDays}
                onChange={(e) => setIntervalDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white/20 text-white border border-clinic-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1" className="bg-clinic-black">1 dia (diário)</option>
                <option value="2" className="bg-clinic-black">2 dias</option>
                <option value="3" className="bg-clinic-black">3 dias</option>
                <option value="4" className="bg-clinic-black">4 dias</option>
                <option value="5" className="bg-clinic-black">5 dias</option>
                <option value="7" className="bg-clinic-black">7 dias (semanal)</option>
              </select>
            </div>

            {/* Total de dias */}
            <div>
              <label className="block text-sm text-white mb-2">Quantos dias?</label>
              <input
                type="number"
                min="1"
                max="30"
                value={totalDays}
                onChange={(e) => setTotalDays(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white/20 text-white border border-clinic-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Horário padrão */}
            <div>
              <label className="block text-sm text-white mb-2 flex items-center gap-2">
                <Clock size={14} />
                Horário padrão
              </label>
              <input
                type="time"
                value={defaultTime}
                onChange={(e) => setDefaultTime(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 text-white border border-clinic-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={createCadenceStructure}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus size={18} />
            Criar Cadência com {totalDays} dias
          </button>

          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
            <p className="text-xs text-blue-300">
              💡 <strong>Como funciona:</strong> As mensagens serão enviadas automaticamente a cada <strong>{intervalDays} dia(s)</strong> no horário configurado, com delay aleatório de 3-10s entre contatos.
            </p>
          </div>
        </div>
      )}

      {/* Step 2 - Edit Days */}
      {cadences.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Cadência: {cadences.length} dias</h3>
              <p className="text-sm text-clinic-gray-400">Mensagens espaçadas a cada {intervalDays} dia(s)</p>
            </div>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Reconfigurar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {cadences.map((day, dayIndex) => (
              <div key={dayIndex} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-500/20 text-blue-400 font-bold rounded-full text-sm">
                      {day.day_number}
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">Dia {day.day_number}</h4>
                      <p className="text-xs text-clinic-gray-400">
                        Enviado em D+{(day.day_number - 1) * intervalDays}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDay(dayIndex)}
                    className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Horário */}
                <div>
                  <label className="block text-xs text-clinic-gray-400 mb-1">Horário</label>
                  <input
                    type="time"
                    value={day.send_time}
                    onChange={(e) => updateDay(dayIndex, 'send_time', e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 text-white border border-clinic-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinic-royal text-sm"
                  />
                  {(() => {
                    const [hours] = day.send_time.split(':').map(Number)
                    if (hours < 8 || hours >= 18) {
                      return (
                        <p className="text-xs text-yellow-400 mt-1">
                          ⚠️ Horário fora do comercial (08:00-18:00)
                        </p>
                      )
                    }
                    return null
                  })()}
                </div>

                {/* Mensagem */}
                <div>
                  <label className="block text-xs text-clinic-gray-400 mb-1">Mensagem *</label>
                  <textarea
                    value={day.message}
                    onChange={(e) => updateDay(dayIndex, 'message', e.target.value)}
                    placeholder="Digite a mensagem para este dia..."
                    rows={3}
                    className="w-full rounded-lg border border-clinic-gray-300 bg-white/20 text-white px-3 py-2 placeholder:text-clinic-gray-400 focus:outline-none focus:ring-2 focus:ring-clinic-royal text-sm"
                  />
                </div>

                {/* Mídias */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-clinic-gray-400">Anexos</label>
                    <button
                      type="button"
                      onClick={() => addMedia(dayIndex)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + Mídia
                    </button>
                  </div>

                  {day.media.map((media, mediaIndex) => (
                    <div key={mediaIndex} className="p-2 rounded bg-white/10 border border-white/10 space-y-2 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-clinic-gray-400">Mídia {mediaIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeMedia(dayIndex, mediaIndex)}
                          className="p-0.5 text-red-400 hover:bg-red-500/20 rounded"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={media.media_type}
                          onChange={(e) => updateMedia(dayIndex, mediaIndex, 'media_type', e.target.value)}
                          className="w-full px-2 py-1 text-xs bg-white/20 text-white border border-clinic-gray-600 rounded focus:outline-none"
                        >
                          <option value="image" className="bg-clinic-black">Imagem</option>
                          <option value="video" className="bg-clinic-black">Vídeo</option>
                          <option value="audio" className="bg-clinic-black">Áudio</option>
                          <option value="document" className="bg-clinic-black">Documento</option>
                        </select>

                        <input
                          type="url"
                          value={media.media_url}
                          onChange={(e) => updateMedia(dayIndex, mediaIndex, 'media_url', e.target.value)}
                          placeholder="URL..."
                          className="w-full px-2 py-1 text-xs bg-white/20 text-white border border-clinic-gray-600 rounded focus:outline-none placeholder:text-clinic-gray-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
