import { useQuery } from '@tanstack/react-query'
import { Users, Send, Calendar, Package, Target, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { dashboardAPI, appointmentsAPI } from '../services/api'

export default function Dashboard() {
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await dashboardAPI.getStats()
      return res.data.data
    },
  })

  const { data: upcomingAppointments, isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery({
    queryKey: ['upcoming-appointments'],
    queryFn: async () => {
      const res = await appointmentsAPI.getUpcoming(7)
      return res.data.data
    },
  })

  const { data: recentActivity, isLoading: activityLoading, refetch: refetchActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const res = await dashboardAPI.getActivity(10)
      return res.data.data
    },
  })

  const handleRefresh = () => {
    refetchStats()
    refetchAppointments()
    refetchActivity()
  }

  const isLoading = statsLoading || appointmentsLoading || activityLoading

  const stats = [
    {
      title: 'Total de Contatos',
      value: dashboardStats?.contacts?.total || 0,
      icon: Users,
      color: 'bg-blue-600',
      subtext: `${dashboardStats?.contacts?.optedIn || 0} ativos`,
      trend: dashboardStats?.contacts?.trend,
    },
    {
      title: 'Mensagens Enviadas',
      value: dashboardStats?.messages?.sent || 0,
      icon: Send,
      color: 'bg-green-600',
      subtext: `${dashboardStats?.messages?.received || 0} recebidas`,
      trend: dashboardStats?.messages?.trend,
    },
    {
      title: 'Campanhas Ativas',
      value: dashboardStats?.campaigns?.active || 0,
      icon: Target,
      color: 'bg-purple-600',
      subtext: `${dashboardStats?.campaigns?.total || 0} total`,
      trend: dashboardStats?.campaigns?.trend,
    },
    {
      title: 'Agendamentos',
      value: dashboardStats?.appointments?.upcoming || 0,
      icon: Calendar,
      color: 'bg-orange-600',
      subtext: 'Próximos 7 dias',
      trend: dashboardStats?.appointments?.trend,
    },
  ]

  const campaignStats = [
    {
      label: 'Mensagens Enviadas',
      value: dashboardStats?.campaignMessages?.sent || 0,
      color: 'bg-green-500',
      percentage: dashboardStats?.campaignMessages?.sentPercentage,
    },
    {
      label: 'Entregues',
      value: dashboardStats?.campaignMessages?.delivered || 0,
      color: 'bg-blue-500',
      percentage: dashboardStats?.campaignMessages?.deliveredPercentage,
    },
    {
      label: 'Pendentes',
      value: dashboardStats?.campaignMessages?.pending || 0,
      color: 'bg-yellow-500',
      percentage: dashboardStats?.campaignMessages?.pendingPercentage,
    },
    {
      label: 'Falhadas',
      value: dashboardStats?.campaignMessages?.failed || 0,
      color: 'bg-red-500',
      percentage: dashboardStats?.campaignMessages?.failedPercentage,
    },
  ]

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return <Send className="w-4 h-4" />
      case 'campaign': return <Target className="w-4 h-4" />
      case 'appointment': return <Calendar className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-green-500/20 text-green-400'
      case 'campaign': return 'bg-purple-500/20 text-purple-400'
      case 'appointment': return 'bg-orange-500/20 text-orange-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'message': return 'Mensagem'
      case 'campaign': return 'Campanha'
      case 'appointment': return 'Agendamento'
      default: return 'Atividade'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-clinic-gray-300">Visão geral do sistema</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span className="ml-2">Atualizar</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none bg-white/10 backdrop-blur-md hover:bg-white/15 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-clinic-gray-300">{stat.title}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-3xl font-bold text-white">{statsLoading ? '...' : stat.value}</p>
                    {stat.trend && (
                      <div className={`flex items-center text-xs ${stat.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stat.trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span className="ml-1">{Math.abs(stat.trend)}%</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-clinic-gray-400 mt-1">{stat.subtext}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color} shrink-0`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Messages Stats */}
        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Estatísticas de Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="animate-spin text-white" size={32} />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {campaignStats.map((stat, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                          <span className="text-sm text-clinic-gray-300">{stat.label}</span>
                        </div>
                        <span className="text-white font-semibold">{stat.value}</span>
                      </div>
                      {stat.percentage !== undefined && (
                        <div className="ml-6">
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className={`${stat.color} h-2 rounded-full transition-all`}
                              style={{ width: `${stat.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-clinic-gray-300">Total de Campanhas</span>
                    <span className="text-white font-bold">{dashboardStats?.campaigns?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-clinic-gray-300">Completadas</span>
                    <span className="text-white font-bold">{dashboardStats?.campaigns?.completed || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-clinic-gray-300">Taxa de Sucesso</span>
                    <span className="text-green-400 font-bold">
                      {dashboardStats?.campaigns?.total > 0
                        ? Math.round((dashboardStats?.campaigns?.completed / dashboardStats?.campaigns?.total) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-none bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="animate-spin text-white" size={32} />
              </div>
            ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map((apt: any) => (
                  <div key={apt.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="p-2 bg-orange-600 rounded shrink-0">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-sm truncate">{apt.title}</h4>
                      <p className="text-xs text-clinic-gray-400 mt-1">
                        {formatDateTime(apt.scheduled_at || apt.start_time)}
                      </p>
                      {(apt.contact_name || apt.contacts?.name) && (
                        <p className="text-xs text-clinic-gray-400">
                          {apt.contact_name || apt.contacts?.name}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                      apt.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                      apt.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {apt.status === 'confirmed' ? 'Confirmado' :
                       apt.status === 'scheduled' ? 'Agendado' : apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto mb-4 text-clinic-gray-400" size={48} />
                <p className="text-sm text-clinic-gray-400">
                  Nenhum agendamento próximo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - Smaller */}
        <Card className="border-none bg-white/10 backdrop-blur-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="animate-spin text-white" size={32} />
              </div>
            ) : recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentActivity.slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <div className={`p-1.5 rounded ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white">{getActivityLabel(activity.type)}</span>
                        <span className="text-xs text-clinic-gray-400">{formatDateTime(activity.timestamp || activity.created_at)}</span>
                      </div>
                      {activity.type === 'message' && activity.data?.content && (
                        <p className="text-xs text-clinic-gray-300 mt-0.5 truncate">{activity.data.content}</p>
                      )}
                      {activity.type === 'campaign' && activity.data?.name && (
                        <p className="text-xs text-clinic-gray-300 mt-0.5">{activity.data.name}</p>
                      )}
                      {activity.type === 'appointment' && activity.data?.title && (
                        <p className="text-xs text-clinic-gray-300 mt-0.5">{activity.data.title}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto mb-4 text-clinic-gray-400" size={32} />
                <p className="text-sm text-clinic-gray-400">
                  Nenhuma atividade recente
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card className="border-none bg-white/10 backdrop-blur-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Previsibilidade de Negócios</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="animate-spin text-white" size={32} />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Revenue Forecast */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Previsão de Receita</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-sm text-clinic-gray-400 mb-1">Este Mês</p>
                      <p className="text-2xl font-bold text-green-400">R$ {(dashboardStats?.financial?.currentMonth || 0).toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-clinic-gray-400 mt-1">{dashboardStats?.financial?.currentMonthDeals || 0} negócios</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-sm text-clinic-gray-400 mb-1">Próximo Mês</p>
                      <p className="text-2xl font-bold text-blue-400">R$ {(dashboardStats?.financial?.nextMonth || 0).toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-clinic-gray-400 mt-1">{dashboardStats?.financial?.nextMonthDeals || 0} negócios</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-sm text-clinic-gray-400 mb-1">Próximos 3 Meses</p>
                      <p className="text-2xl font-bold text-purple-400">R$ {(dashboardStats?.financial?.threeMonths || 0).toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-clinic-gray-400 mt-1">{dashboardStats?.financial?.threeMonthsDeals || 0} negócios</p>
                    </div>
                  </div>
                </div>

                {/* Deal Pipeline */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Pipeline de Negócios</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-sm text-clinic-gray-300">Leads Qualificados</span>
                      </div>
                      <span className="text-white font-semibold">{dashboardStats?.pipeline?.qualified || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-clinic-gray-300">Em Negociação</span>
                      </div>
                      <span className="text-white font-semibold">{dashboardStats?.pipeline?.negotiating || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm text-clinic-gray-300">Fechados</span>
                      </div>
                      <span className="text-white font-semibold">{dashboardStats?.pipeline?.closed || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
