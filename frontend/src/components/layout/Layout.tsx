import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Send, Calendar, MessageSquare, LogOut, Smartphone, Tag, Package, Menu, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import NotificationBell from '../NotificationBell'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navigation = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/whatsapp', icon: Smartphone, label: 'WhatsApp' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/contacts', icon: Users, label: 'Pacientes' },
    { to: '/tags', icon: Tag, label: 'Tags' },
    { to: '/products', icon: Package, label: 'Produtos' },
    { to: '/campaigns', icon: Send, label: 'Campanhas' },
    { to: '/schedule', icon: Calendar, label: 'Agenda' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-clinic-black via-clinic-gray-900 to-clinic-petroleum">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative
        w-64 h-full
        bg-clinic-black/50 backdrop-blur-sm
        border-r border-clinic-royal/20
        flex flex-col
        z-50
        transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 text-white md:hidden hover:bg-clinic-royal/20 rounded-lg"
        >
          <X size={20} />
        </button>

        <div className="p-6 border-b border-clinic-royal/20">
          <h1 className="text-2xl font-bold text-white">Dr. Denis Tuma</h1>
          <p className="text-clinic-gray-400 text-sm">Cirurgia Plástica</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsSidebarOpen(false)}
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
      <main className="flex-1 overflow-auto flex flex-col w-full md:w-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-clinic-black/30 backdrop-blur-sm border-b border-white/10">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-white md:hidden hover:bg-clinic-royal/20 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 md:flex-none" />
          <NotificationBell />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
