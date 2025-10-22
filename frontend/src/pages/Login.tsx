import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data } = await authAPI.login(email, password)
      localStorage.setItem('access_token', data.data.tokens.accessToken)
      setUser(data.data.user)
      toast.success('Login realizado com sucesso!')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-clinic-black via-clinic-gray-900 to-clinic-petroleum p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-clinic-royal">Dr. Denis Tuma</h1>
            <p className="text-clinic-gray-600">Cirurgia Plástica</p>
          </div>
          <CardTitle>Acesso ao Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-clinic-gray-500">
            <p>Use: apps@unblind.art</p>
            <p className="font-mono text-xs">Senha: m+0aGjQ6UX7d0wovuTvNphc3vQNbHHDM</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
