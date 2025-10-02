import { supabase, supabaseNoPersist } from '@/lib/supabase'
import type { User, Zone, Area, Cell, Member, Meeting, Alert, SystemSettings } from '@/lib/supabase'

// Authentication Services
export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabaseNoPersist
        .from('users')
        .insert([
          {
            id: data.user.id,
            name: userData.name || '',
            phone: userData.phone,
            role: userData.role || 'cell-leader',
            zone_id: userData.zone_id,
            area_id: userData.area_id,
            cell_id: userData.cell_id,
            is_active: true,
          }
        ])

      if (profileError) throw profileError
    }

    return data
  },
  
  // Sign up new user without persisting/replacing the current session
  async signUpNoPersist(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await supabaseNoPersist.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: userData.role,
          name: userData.name,
          phone: userData.phone,
          zone_id: userData.zone_id,
          area_id: userData.area_id,
          cell_id: userData.cell_id,
        },
      },
    })

    if (error) throw error

    if (data.user) {
      const { error: profileError } = await supabaseNoPersist
        .from('users')
        .insert([
          {
            id: data.user.id,
            name: userData.name || '',
            phone: userData.phone,
            role: userData.role || 'cell-leader',
            zone_id: userData.zone_id,
            area_id: userData.area_id,
            cell_id: userData.cell_id,
            is_active: true,
          }
        ])

      if (profileError) throw profileError
    }

    return data
  },

  // Admin: create user (auto-confirm email) and create profile row
  async adminCreateUser(email: string, password: string, userData: Partial<User>) {
    // Create auth user with email confirmed so they can sign in immediately
    const { data: created, error: adminError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: userData.role,
        name: userData.name,
        phone: userData.phone,
      },
    })

    if (adminError) throw adminError

    const authUser = created.user

    // Create profile row in users table to mirror auth user
    if (authUser) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.id,
            name: userData.name || '',
            phone: userData.phone,
            role: userData.role || 'cell-leader',
            zone_id: userData.zone_id,
            area_id: userData.area_id,
            cell_id: userData.cell_id,
            is_active: true,
          }
        ])

      if (profileError) throw profileError
    }

    return created
  },

  // Provision user via Edge Function (production-ready): auto-confirm + require_password_reset
  async provisionUser(payload: {
    email: string
    password: string
    name: string
    phone?: string
    role: User['role']
    zone_id?: string
    area_id?: string
    cell_id?: string
  }) {
    // Always try Edge Function first. It uses service role to bypass RLS and upsert profile reliably.
    try {
      const { data, error } = await supabase.functions.invoke('provision-user', {
        body: payload,
      }) as any
      if (!error && data) {
        return data
      }
    } catch (err: any) {
      // Any failure (including CORS/preflight or missing function) should fall back to keep UX working
      console.warn('provision-user edge function failed; falling back to client signUp.', err);
    }
    // Fallback: client provisioning (works in dev/local). May be subject to RLS for profile row; we ignore that.
    const { data, error } = await supabaseNoPersist.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          role: payload.role,
          name: payload.name,
          phone: payload.phone,
          zone_id: payload.zone_id,
          area_id: payload.area_id,
          cell_id: payload.cell_id,
        },
      },
    })
    if (error) throw error
    const authUser = (data as any)?.user
    if (authUser?.id) {
      try {
        await supabaseNoPersist
          .from('users')
          .insert([
            {
              id: authUser.id,
              name: payload.name || '',
              phone: payload.phone,
              role: payload.role || 'cell-leader',
              zone_id: payload.zone_id,
              area_id: payload.area_id,
              cell_id: payload.cell_id,
              is_active: true,
            } as any,
          ])
      } catch (profileErr) {
        // Ignore RLS/profile insert errors in fallback to avoid breaking area creation;
        console.warn('Profile insert failed (fallback path). Proceeding without profile row.', profileErr)
      }
      return { userId: authUser.id, user: authUser, password: payload.password }
    }
    throw new Error('User creation failed')
  },

  // Sign in user
  async signIn(email: string, password: string) {
    console.log('Supabase signIn attempt:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Supabase auth error:', error);
      throw error;
    }

    console.log('Supabase auth success:', data);

    // Update last login
    if (data.user) {
      try {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id)
        console.log('Last login updated for user:', data.user.id);
      } catch (updateError) {
        console.error('Failed to update last login:', updateError);
        // Don't throw here, login was successful
      }
    }

    return data
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getCurrentUser() {
    const { data: authData } = await supabase.auth.getUser()
    const authUser = authData?.user
    if (!authUser) return null

    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      if (error) throw error
      if (profile) return profile as any
    } catch (err) {
      // Fall through to metadata-based fallback
      console.warn('Profile fetch failed; using metadata fallback.', err)
    }

    const m = (authUser as any)?.user_metadata || {}
    // Build a minimal profile from metadata so UI can proceed
    const fallbackProfile: any = {
      id: authUser.id,
      name: m.name || (authUser.email ? String(authUser.email).split('@')[0] : 'User'),
      phone: m.phone || undefined,
      role: (m.role as any) || 'area-leader',
      zone_id: m.zone_id || undefined,
      area_id: m.area_id || undefined,
      cell_id: m.cell_id || undefined,
      is_active: true,
      avatar: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    }
    return fallbackProfile
  },

  // Get auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// System Settings Services
export const settingsService = {
  // Fetch singleton system settings row
  async getSystemSettings(): Promise<SystemSettings | null> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 'global')
        .single()
      if (error) throw error
      return (data as unknown) as SystemSettings
    } catch (err: any) {
      // If no row exists yet, return null and let caller initialize defaults
      const msg = String(err?.message || '').toLowerCase()
      if (msg.includes('row') && msg.includes('not') && msg.includes('found')) return null
      return null
    }
  },

  // Create or update the singleton settings row
  async saveSystemSettings(payload: Omit<SystemSettings,
    'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<SystemSettings> {
    const body: Partial<SystemSettings> = {
      id: 'global',
      church_name: payload.church_name,
      contact_email: payload.contact_email,
      contact_phone: payload.contact_phone,
      timezone: payload.timezone,
      date_format: payload.date_format,
      currency: payload.currency,
      max_cell_size: payload.max_cell_size,
      backup_frequency: payload.backup_frequency as any,
      email_notifications: payload.email_notifications,
      sms_notifications: payload.sms_notifications,
      push_notifications: payload.push_notifications,
    }
    const { data, error } = await supabase
      .from('system_settings')
      .upsert([body], { onConflict: 'id' })
      .select()
      .single()
    if (error) throw error
    return (data as unknown) as SystemSettings
  },
}

// User Management Services
export const userService = {
  // Get all users
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get user by ID
  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create user
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Create user with explicit ID (used to sync from Supabase Auth)
  async createUserWithId(id: string, userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ id, ...userData }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update user
  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete user
  async deleteUser(id: string) {
    // Clear leadership references in related tables to avoid constraint or logic issues
    const { error: zlErr } = await supabase
      .from('zones')
      .update({ leader_id: null })
      .eq('leader_id', id)
    if (zlErr) throw zlErr

    const { error: alErr } = await supabase
      .from('areas')
      .update({ leader_id: null })
      .eq('leader_id', id)
    if (alErr) throw alErr

    const { error: clErr } = await supabase
      .from('cells')
      .update({ leader_id: null })
      .eq('leader_id', id)
    if (clErr) throw clErr

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // Get users by role
  async getUsersByRole(role: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .eq('is_active', true)

    if (error) throw error
    return data || []
  }
}

// Zone Management Services
export const zoneService = {
  // Get all zones
  async getZones() {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get zone by ID
  async getZoneById(id: string) {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create zone
  async createZone(zoneData: Omit<Zone, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('zones')
      .insert([zoneData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update zone
  async updateZone(id: string, updates: Partial<Zone>) {
    const { data, error } = await supabase
      .from('zones')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete zone
  async deleteZone(id: string) {
    // Prefer server-side cascade via Edge Function in production
    try {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('admin-delete-zone', {
        body: { zone_id: id },
      }) as any

      // If the function executed and returned success, we are done
      if (!fnErr && fnData && fnData.success) return

      // Only fall back if the function is missing/not deployed
      const msg = String(fnErr?.message || '').toLowerCase()
      const shouldFallback = msg.includes('not found') || msg.includes('function') && msg.includes('missing')
      if (!shouldFallback) {
        // Propagate error so caller can handle and UI won't appear successful
        throw fnErr
      }
      // else: fall through to client-side cascade
    } catch (e) {
      // Fall back to client-side cascade if function isn't available
    }

    // Fallback: Cascade delete dependents in safe order
    // 0) get zone to capture leader (if any)
    const { data: zoneRow, error: zoneErr } = await supabase
      .from('zones')
      .select('id, leader_id')
      .eq('id', id)
      .single()
    if (zoneErr) throw zoneErr

    // 1) find areas in this zone
    const { data: areas, error: areasErr } = await supabase
      .from('areas')
      .select('id')
      .eq('zone_id', id)
    if (areasErr) throw areasErr

    const areaIds = (areas || []).map((a: any) => a.id)

    if (areaIds.length > 0) {
      // 2) find cells in these areas
      const { data: cells, error: cellsErr } = await supabase
        .from('cells')
        .select('id')
        .in('area_id', areaIds)
      if (cellsErr) throw cellsErr

      const cellIds = (cells || []).map((c: any) => c.id)

      if (cellIds.length > 0) {
        // 3) delete meetings then members then cells
        const { error: delMeetingsErr } = await supabase
          .from('meetings')
          .delete()
          .in('cell_id', cellIds)
        if (delMeetingsErr) throw delMeetingsErr

        const { error: delMembersErr } = await supabase
          .from('members')
          .delete()
          .in('cell_id', cellIds)
        if (delMembersErr) throw delMembersErr

        const { error: delCellsErr } = await supabase
          .from('cells')
          .delete()
          .in('id', cellIds)
        if (delCellsErr) throw delCellsErr

        // 3b) delete users tied to these cells (cell leaders)
        const { error: delCellUsersErr } = await supabase
          .from('users')
          .delete()
          .in('cell_id', cellIds)
        if (delCellUsersErr) throw delCellUsersErr
      }

      // 3c) delete users tied to these areas (area leaders)
      const { error: delAreaUsersErr } = await supabase
        .from('users')
        .delete()
        .in('area_id', areaIds)
      if (delAreaUsersErr) throw delAreaUsersErr

      // 4) nullify area leaders then delete areas
      const { error: nullAreaLeadersErr } = await supabase
        .from('areas')
        .update({ leader_id: null })
        .in('id', areaIds)
      if (nullAreaLeadersErr) throw nullAreaLeadersErr

      const { error: delAreasErr } = await supabase
        .from('areas')
        .delete()
        .in('id', areaIds)
      if (delAreasErr) throw delAreasErr
    }

    // 4b) delete users tied directly to this zone (zone leader and any others with zone_id)
    if (zoneRow?.leader_id) {
      // nullify FK before deleting the leader user
      const { error: nullZoneLeaderFKErr } = await supabase
        .from('zones')
        .update({ leader_id: null })
        .eq('id', id)
      if (nullZoneLeaderFKErr) throw nullZoneLeaderFKErr

      // delete the zone leader explicitly by id
      const { error: delZoneLeaderErr } = await supabase
        .from('users')
        .delete()
        .eq('id', zoneRow.leader_id)
      if (delZoneLeaderErr) throw delZoneLeaderErr
    }

    const { error: delZoneUsersErr } = await supabase
      .from('users')
      .delete()
      .eq('zone_id', id)
    if (delZoneUsersErr) throw delZoneUsersErr

    // 5) finally delete the zone
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// Area Management Services
export const areaService = {
  // Get all areas
  async getAreas() {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get areas by zone
  async getAreasByZone(zoneId: string) {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('zone_id', zoneId)

    if (error) throw error
    return data || []
  },

  // Create area
  async createArea(areaData: Omit<Area, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('areas')
      .insert([areaData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update area
  async updateArea(id: string, updates: Partial<Area>) {
    const { data, error } = await supabase
      .from('areas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete area
  async deleteArea(id: string) {
    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Cell Management Services
export const cellService = {
  // Get all cells
  async getCells() {
    const { data, error } = await supabase
      .from('cells')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get cells by area
  async getCellsByArea(areaId: string) {
    const { data, error } = await supabase
      .from('cells')
      .select('*')
      .eq('area_id', areaId)

    if (error) throw error
    return data || []
  },

  // Create cell
  async createCell(cellData: Omit<Cell, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('cells')
      .insert([cellData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update cell
  async updateCell(id: string, updates: Partial<Cell>) {
    const { data, error } = await supabase
      .from('cells')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete cell
  async deleteCell(id: string) {
    const { error } = await supabase
      .from('cells')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Member Management Services
export const memberService = {
  // Get all members
  async getMembers() {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get members by cell
  async getMembersByCell(cellId: string) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('cell_id', cellId)

    if (error) throw error
    return data || []
  },

  // Create member
  async createMember(memberData: Omit<Member, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('members')
      .insert([memberData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update member
  async updateMember(id: string, updates: Partial<Member>) {
    const { data, error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete member
  async deleteMember(id: string) {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Meeting Management Services
export const meetingService = {
  // Get all meetings
  async getMeetings() {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get meetings by cell
  async getMeetingsByCell(cellId: string) {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('cell_id', cellId)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Create meeting
  async createMeeting(meetingData: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('meetings')
      .insert([meetingData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update meeting
  async updateMeeting(id: string, updates: Partial<Meeting>) {
    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete meeting
  async deleteMeeting(id: string) {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Alert Management Services
export const alertService = {
  // Get all alerts
  async getAlerts() {
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        creator:users(id, name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get active alerts for user
  async getActiveAlertsForUser(userRole: string) {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('is_active', true)
      .or(`target_audience.eq.all,target_audience.eq.${userRole}s`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Create alert
  async createAlert(alertData: Omit<Alert, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('alerts')
      .insert([alertData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update alert
  async updateAlert(id: string, updates: Partial<Alert>) {
    const { data, error } = await supabase
      .from('alerts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete alert
  async deleteAlert(id: string) {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Real-time subscriptions
export const subscriptionService = {
  // Subscribe to table changes
  subscribeToTable(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe()
  },

  // Subscribe to user-specific changes
  subscribeToUserChanges(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user_${userId}_changes`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        callback
      )
      .subscribe()
  }
}
