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

export interface WhatsAppChat {
  id: string
  remoteJid: string
  name: string
  phone: string
  profilePicUrl?: string
  unreadCount: number
  lastMessageTime?: number
  lastMessage?: {
    text: string
    timestamp: number
    fromMe: boolean
  } | null
  isGroup: boolean
}

export interface SyncStats {
  total: number
  created: number
  updated: number
  skipped: number
}

export const contactsAPI = {
  getAll: () => api.get<{ success: boolean; data: Contact[] }>('/contacts'),
  getContacts: (params: any) => api.get<{ success: boolean; data: Contact[] }>('/contacts', { params }),
  getById: (id: string) => api.get<{ success: boolean; data: Contact }>(`/contacts/${id}`),
  create: (data: Partial<Contact>) => api.post<{ success: boolean; data: Contact }>('/contacts', data),
  update: (id: string, data: Partial<Contact>) => api.put<{ success: boolean; data: Contact }>(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
  bulkImport: (contacts: any[]) => api.post('/contacts/bulk-import', { contacts }),
  getStats: () => api.get<{ success: boolean; data: Stats }>('/contacts/stats'),
  syncWhatsApp: (instanceName: string) =>
    api.post<{ success: boolean; message: string; stats: SyncStats }>(`/contacts/sync-whatsapp/${encodeURIComponent(instanceName)}`),
  getWhatsAppChats: (instanceName: string) =>
    api.get<{ success: boolean; data: WhatsAppChat[] }>(`/contacts/whatsapp-chats/${encodeURIComponent(instanceName)}`),
  getContactMedia: (contactId: string, type?: string) =>
    api.get<{ success: boolean; data: any }>(`/contacts/${contactId}/media`, { params: { type } }),
  addTagsToContact: (contactId: string, tagIds: string[]) =>
    api.post(`/contacts/${contactId}/tags`, { tagIds }),
  addProductsToContact: (contactId: string, productIds: string[]) =>
    api.post(`/contacts/${contactId}/products`, { productIds }),
  findDuplicates: () =>
    api.get<{ success: boolean; data: any[] }>('/contacts/duplicates'),
  mergeContacts: (primaryContactId: string, contactIdsToMerge: string[]) =>
    api.post('/contacts/merge', { primaryContactId, contactIdsToMerge }),
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

export interface WhatsAppInstance {
  instance: {
    instanceName: string
    status: string
  }
  hash?: {
    apikey: string
  }
  qrcode?: {
    base64?: string
    code?: string
  }
}

export const whatsappAPI = {
  createInstance: (instanceName: string) =>
    api.post<{ success: boolean; data: WhatsAppInstance }>('/whatsapp/instances', { instanceName }),
  getAllInstances: () =>
    api.get<{ success: boolean; data: WhatsAppInstance[] }>('/whatsapp/instances'),
  getInstanceStatus: (instanceName: string) =>
    api.get<{ success: boolean; data: any }>(`/whatsapp/instances/${encodeURIComponent(instanceName)}/status`),
  getQRCode: (instanceName: string) =>
    api.get<{ success: boolean; data: WhatsAppInstance }>(`/whatsapp/instances/${encodeURIComponent(instanceName)}/qrcode`),
  // connectInstance agora usa getQRCode (mesma coisa)
  connectInstance: (instanceName: string) =>
    api.get<{ success: boolean; data: WhatsAppInstance }>(`/whatsapp/instances/${encodeURIComponent(instanceName)}/qrcode`),
  disconnectInstance: (instanceName: string) =>
    api.post<{ success: boolean; message: string }>(`/whatsapp/instances/${encodeURIComponent(instanceName)}/disconnect`),
  deleteInstance: (instanceName: string) =>
    api.delete<{ success: boolean; message: string }>(`/whatsapp/instances/${encodeURIComponent(instanceName)}`),
}

export interface ChatMessage {
  id: string
  message: string
  direction: 'inbound' | 'outbound'
  status: string
  timestamp: string
  mediaUrl?: string
  mediaType?: string
  metadata?: any
}

export interface SendMessagePayload {
  message?: string
  messageType?: 'text' | 'media' | 'audio' | 'sticker' | 'contact'
  mediaUrl?: string
  mediaType?: string
  audioUrl?: string
  stickerUrl?: string
  contactData?: {
    fullName: string
    wuid?: string
    phoneNumber: string
    organization?: string
  }
}

export interface Conversation {
  phone: string
  lastMessage: string
  lastMessageTime: string
  lastMessageDirection: 'inbound' | 'outbound'
  unreadCount: number
}

export interface Tag {
  id: string
  name: string
  color: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price?: number
  sku?: string
  category?: string
  image_url?: string
  is_active?: boolean
  metadata?: any
  created_at?: string
  updated_at?: string
}

export const tagsAPI = {
  getAll: () => api.get<{ success: boolean; data: Tag[] }>('/tags'),
  create: (data: Partial<Tag>) => api.post<{ success: boolean; data: Tag }>('/tags', data),
  update: (id: string, data: Partial<Tag>) => api.put<{ success: boolean; data: Tag }>(`/tags/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/tags/${id}`),
  addToContact: (tagId: string, contactId: string) =>
    api.post<{ success: boolean }>(`/tags/${tagId}/contacts/${contactId}`),
  removeFromContact: (tagId: string, contactId: string) =>
    api.delete<{ success: boolean }>(`/tags/${tagId}/contacts/${contactId}`),
  getContactsByTag: (tagId: string) =>
    api.get<{ success: boolean; data: Contact[] }>(`/tags/${tagId}/contacts`),
  getContactsCountByTag: (tagId: string) =>
    api.get<{ success: boolean; data: { count: number } }>(`/tags/${tagId}/contacts/count`),
  // Backwards compatibility
  getTags: () => api.get<{ success: boolean; data: Tag[] }>('/tags'),
  createTag: (data: Partial<Tag>) => api.post<{ success: boolean; data: Tag }>('/tags', data),
  updateTag: (id: string, data: Partial<Tag>) => api.put<{ success: boolean; data: Tag }>(`/tags/${id}`, data),
  deleteTag: (id: string) => api.delete<{ success: boolean }>(`/tags/${id}`),
}

export const productsAPI = {
  getAll: () => api.get<{ success: boolean; data: Product[] }>('/products'),
  create: (data: Partial<Product>) => api.post<{ success: boolean; data: Product }>('/products', data),
  update: (id: string, data: Partial<Product>) => api.put<{ success: boolean; data: Product }>(`/products/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/products/${id}`),
  addToContact: (productId: string, contactId: string, notes?: string) =>
    api.post<{ success: boolean }>(`/products/${productId}/contacts/${contactId}`, { notes }),
  removeFromContact: (productId: string, contactId: string) =>
    api.delete<{ success: boolean }>(`/products/${productId}/contacts/${contactId}`),
  getContactsByProduct: (productId: string) =>
    api.get<{ success: boolean; data: Contact[] }>(`/products/${productId}/contacts`),
  // Backwards compatibility
  getProducts: () => api.get<{ success: boolean; data: Product[] }>('/products'),
  createProduct: (data: Partial<Product>) => api.post<{ success: boolean; data: Product }>('/products', data),
  updateProduct: (id: string, data: Partial<Product>) => api.put<{ success: boolean; data: Product }>(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete<{ success: boolean }>(`/products/${id}`),
}

export const chatAPI = {
  getAllConversations: (instanceName: string) =>
    api.get<{ success: boolean; data: Conversation[] }>(`/chat/${encodeURIComponent(instanceName)}`),
  getConversation: (instanceName: string, phone: string, limit = 50, offset = 0) =>
    api.get<{ success: boolean; data: { messages: ChatMessage[]; total: number; phone: string } }>(
      `/chat/${encodeURIComponent(instanceName)}/${phone}?limit=${limit}&offset=${offset}`
    ),
  sendMessage: (instanceName: string, phone: string, payload: SendMessagePayload) =>
    api.post<{ success: boolean; data: ChatMessage }>(
      `/chat/${encodeURIComponent(instanceName)}/${phone}`,
      payload
    ),
}

export const appointmentsAPI = {
  getAll: (params?: any) => api.get('/appointments', { params }),
  getById: (id: string) => api.get(`/appointments/${id}`),
  create: (data: any) => api.post('/appointments', data),
  update: (id: string, data: any) => api.put(`/appointments/${id}`, data),
  delete: (id: string) => api.delete(`/appointments/${id}`),
  cancel: (id: string) => api.post(`/appointments/${id}/cancel`),
  complete: (id: string) => api.post(`/appointments/${id}/complete`),
  getUpcoming: (days?: number) => api.get('/appointments/upcoming', { params: { days } }),
  getStats: (params?: any) => api.get('/appointments/stats', { params }),
}

export const dashboardAPI = {
  getStats: (params?: any) => api.get('/dashboard/stats', { params }),
  getActivity: (limit?: number) => api.get('/dashboard/activity', { params: { limit } }),
}

export default api
