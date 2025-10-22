import axios from 'axios'
import type { AuthResponse, User, Contact, Campaign, Message, Stats } from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: AuthResponse }>('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data),
  getProfile: () => api.get<{ success: boolean; data: User }>('/auth/profile'),
}

export const contactsAPI = {
  getAll: () => api.get<{ success: boolean; data: Contact[] }>('/contacts'),
  getById: (id: string) => api.get<{ success: boolean; data: Contact }>(`/contacts/${id}`),
  create: (data: Partial<Contact>) => api.post<{ success: boolean; data: Contact }>('/contacts', data),
  update: (id: string, data: Partial<Contact>) => api.put<{ success: boolean; data: Contact }>(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
  bulkImport: (contacts: any[]) => api.post('/contacts/bulk-import', { contacts }),
  getStats: () => api.get<{ success: boolean; data: Stats }>('/contacts/stats'),
}

export const campaignsAPI = {
  getAll: () => api.get<{ success: boolean; data: Campaign[] }>('/campaigns'),
  getById: (id: string) => api.get<{ success: boolean; data: Campaign }>(`/campaigns/${id}`),
  create: (data: Partial<Campaign>) => api.post<{ success: boolean; data: Campaign }>('/campaigns', data),
  pause: (id: string) => api.post(`/campaigns/${id}/pause`),
  resume: (id: string) => api.post(`/campaigns/${id}/resume`),
  cancel: (id: string) => api.post(`/campaigns/${id}/cancel`),
}

export const messagesAPI = {
  getAll: () => api.get<{ success: boolean; data: Message[] }>('/messages'),
  send: (data: { to: string; message: string; mediaUrl?: string }) =>
    api.post<{ success: boolean; data: Message }>('/messages/send', data),
  getStats: () => api.get<{ success: boolean; data: Stats }>('/messages/stats'),
}

export default api
