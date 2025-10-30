export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'admin' | 'user' | 'operator'
  created_at: string
}

export interface AuthResponse {
  user: User
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export interface Contact {
  id: string
  user_id: string
  phone: string
  name?: string
  email?: string
  tags: string[]
  products: string[]
  custom_fields: Record<string, any>
  opt_in_status: 'pending' | 'opted_in' | 'opted_out'
  opt_in_at?: string
  opt_out_at?: string
  is_blocked: boolean
  last_message_at?: string
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  template_id?: string
  message: string
  target_type: 'all' | 'group' | 'tag' | 'individual'
  group_id?: string
  tags: string[]
  total_contacts: number
  total_sent?: number
  total_delivered?: number
  total_read?: number
  total_failed?: number
  status: 'draft' | 'scheduled' | 'active' | 'processing' | 'completed' | 'paused' | 'cancelled' | 'failed'
  scheduled_for?: string
  scheduled_start?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  user_id: string
  contact_id: string
  phone: string
  message: string
  media_url?: string
  media_type?: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  direction: 'inbound' | 'outbound'
  scheduled_for?: string
  sent_at?: string
  delivered_at?: string
  read_at?: string
  error_message?: string
  created_at: string
}

export interface Appointment {
  id: string
  contact_id: string
  contact_name: string
  contact_phone: string
  date: string
  time: string
  service: string
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  created_at: string
}

export interface Stats {
  total: number
  sent?: number
  delivered?: number
  failed?: number
  pending?: number
  optedIn?: number
  optedOut?: number
}
