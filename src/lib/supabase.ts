import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// A secondary client that does NOT persist/replace the browser session.
// Use this for admin-like provisioning calls from the client during development
// (e.g., signUp new users) to avoid logging out the current admin session.
export const supabaseNoPersist = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

// Database Types
export interface User {
  id: string
  name: string
  phone?: string
  role: 'super-admin' | 'zone-leader' | 'area-leader' | 'cell-leader'
  zone_id?: string
  area_id?: string
  cell_id?: string
  is_active: boolean
  avatar?: string
  created_at: string
  updated_at: string
  last_login?: string
}

export interface Zone {
  id: string
  name: string
  leader_id?: string
  district_name?: string
  district_leader?: string
  district_pastor?: string
  description?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Area {
  id: string
  name: string
  zone_id: string
  leader_id?: string
  district_name?: string
  district_leader?: string
  district_pastor?: string
  description?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Cell {
  id: string
  name: string
  area_id: string
  leader_id?: string
  location?: string
  meeting_day?: string
  meeting_time?: string
  description?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  name: string
  email?: string
  phone?: string
  cell_id: string
  date_joined?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  cell_id: string
  date: string
  attendance_count: number
  offering_amount: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  target_audience: 'all' | 'super-admins' | 'zone-leaders' | 'area-leaders' | 'cell-leaders'
  priority: 'low' | 'normal' | 'high'
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  // Optional: when present, restricts visibility to these user ids only
  recipient_user_ids?: string[]
}

// Global system settings (singleton row with id = 'global')
export interface SystemSettings {
  id: string // 'global'
  church_name: string
  contact_email: string
  contact_phone: string
  timezone: string
  date_format: string
  currency: string
  max_cell_size: number
  backup_frequency: 'daily' | 'weekly' | 'monthly'
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  created_at: string
  updated_at: string
}
