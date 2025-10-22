import { useQuery } from '@tanstack/react-query'
import { Users, Send, MessageSquare, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { contactsAPI, messagesAPI } from '../services/api'

export default function Dashboard() {
  const { data: contactStats } = useQuery({
    queryKey: ['contact-stats'],
    queryFn: async () => {
      const res = await contactsAPI.getStats()
      return res.data.data
    },
  })

  const { data: messageStats } = useQuery({
    queryKey: ['message-stats'],
    queryFn: async () => {
      const res = await messagesAPI.getStats()
      return res.data.data
    },
  })

  const stats = [
    {
      title: 'Total de Pacientes',
      value: contactStats?.total || 0,
      icon: Users,
      color: 'bg-clinic-royal',
      subtext: `${contactStats?.optedIn || 0} ativos`,
    },
    {
      title: 'Mensagens Enviadas',
      value: messageStats?.sent || 0,
      icon: Send,
      color: 'bg-clinic-petroleum',
      subtext: `${messageStats?.pending || 0} pendentes`,
    },
    {
      title: 'Taxa de Entrega',
      value: messageStats?.total
        ? `${Math.round(((messageStats.delivered || 0) / messageStats.total) * 100)}%`
        : '0%',
      icon: MessageSquare,
      color: 'bg-green-600',
      subtext: `${messageStats?.delivered || 0} entregues`,
    },
    {
      title: 'Agendamentos Hoje',
      value: 0,
      icon: Calendar,
      color: 'bg-purple-600',
      subtext: '0 confirmados',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-clinic-gray-300">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none bg-white/10 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-clinic-gray-300">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  <p className="text-xs text-clinic-gray-400 mt-1">{stat.subtext}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-clinic-gray-300">
                <div className="w-2 h-2 rounded-full bg-clinic-royal"></div>
                <span className="text-sm">Sistema iniciado com sucesso</span>
              </div>
              <div className="flex items-center gap-3 text-clinic-gray-300">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Conexão com WhatsApp estabelecida</span>
              </div>
              <div className="flex items-center gap-3 text-clinic-gray-300">
                <div className="w-2 h-2 rounded-full bg-clinic-petroleum"></div>
                <span className="text-sm">Banco de dados sincronizado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-clinic-gray-300">API Backend</span>
                <span className="text-sm text-green-400 font-medium">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-clinic-gray-300">Evolution API</span>
                <span className="text-sm text-green-400 font-medium">● Conectado</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-clinic-gray-300">Redis</span>
                <span className="text-sm text-green-400 font-medium">● Ativo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-clinic-gray-300">Database</span>
                <span className="text-sm text-green-400 font-medium">● Conectado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
