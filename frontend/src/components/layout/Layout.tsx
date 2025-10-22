import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Send, Calendar, MessageSquare, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const navigation = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/contacts', icon: Users, label: 'Pacientes' },
    { to: '/campaigns', icon: Send, label: 'Campanhas' },
    { to: '/messages', icon: MessageSquare, label: 'Mensagens' },
    { to: '/schedule', icon: Calendar, label: 'Agenda' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-clinic-black via-clinic-gray-900 to-clinic-petroleum">
      <aside className="w-64 bg-clinic-black/50 backdrop-blur-sm border-r border-clinic-royal/20 flex flex-col">
        <div className="p-6 border-b border-clinic-royal/20">
          <h1 className="text-2xl font-bold text-white">Dr. Denis Tuma</h1>
          <p className="text-clinic-gray-400 text-sm">Cirurgia Plástica</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                location.pathname === to
                  ? 'bg-clinic-royal text-white shadow-lg shadow-clinic-royal/50'
                  : 'text-clinic-gray-300 hover:bg-clinic-royal/10 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-clinic-royal/20">
          <div className="flex items-center justify-between text-clinic-gray-300">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-clinic-royal/20 rounded-lg transition-colors ml-2"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
