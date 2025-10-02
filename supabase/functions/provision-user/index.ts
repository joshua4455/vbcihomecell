// @ts-nocheck
// Supabase Edge Function: provision-user
// Creates a new auth user (email confirmed), sets require_password_reset metadata,
// and inserts a corresponding profile row in public.users
//
// Deploy: supabase functions deploy provision-user
// redeploy-marker: forcing fresh deployment to pick up supabase.toml verify_jwt=false

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = Deno.env.get('ALLOWED_ORIGINS') || '*'
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    const body = await req.json();
    const { email, password, name, phone, role, zone_id, area_id, cell_id } = body as {
      email: string;
      password: string;
      name: string;
      phone?: string;
      role: 'super-admin' | 'zone-leader' | 'area-leader' | 'cell-leader';
      zone_id?: string;
      area_id?: string;
      cell_id?: string;
    };

    if (!email || !password || !name || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Note: Supabase blocks setting secrets starting with SUPABASE_, so use PROJECT_URL
    const supabaseUrl = Deno.env.get('PROJECT_URL');
    // Note: Supabase blocks setting secrets starting with SUPABASE_, so use SERVICE_ROLE_KEY
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Missing environment configuration' }), { status: 500, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1) Create auth user with email confirmed (no forced reset)
    const { data: created, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        name,
        phone,
        zone_id,
        area_id,
        cell_id,
      },
    });

    if (adminError) {
      // If the user already exists, try to find and update password + metadata
      const msg = String(adminError.message || '').toLowerCase();
      const isDuplicate = (
        msg.includes('already registered') ||
        msg.includes('already exists') ||
        msg.includes('duplicate key') ||
        msg.includes('user with this email') ||
        msg.includes('email already')
      );
      if (!isDuplicate) {
        return new Response(JSON.stringify({ error: adminError.message || 'createUser failed' }), { status: 400, headers: corsHeaders });
      }

      // Find existing user by listing and matching email (acceptable for small datasets)
      try {
        let found: any = null;
        let page = 1;
        const perPage = 1000;
        // paginate until we find or break
        while (!found && page <= 10) {
          const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
          if (listErr) throw listErr;
          found = list.users?.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase()) || null;
          if (!list.users || list.users.length < perPage) break;
          page++;
        }

        if (!found) {
          return new Response(JSON.stringify({ error: 'User exists but could not be located for update' }), { status: 400, headers: corsHeaders });
        }

        // Use provided password if available; otherwise set a strong random one
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
        const rand = (n: number) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
        const fallbackPassword = rand(12) + '!A1';
        const effectivePassword = (password && password.length >= 8) ? password : fallbackPassword;

        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(found.id, {
          password: effectivePassword,
          email_confirm: true,
          user_metadata: {
            ...(found.user_metadata || {}),
            role,
            name,
            phone,
            zone_id,
            area_id,
            cell_id,
          },
        });
        if (updErr) {
          return new Response(JSON.stringify({ error: updErr.message }), { status: 400, headers: corsHeaders });
        }

        // upsert profile row
        const { error: upsertErr } = await supabaseAdmin
          .from('users')
          .upsert({
            id: found.id,
            name,
            phone,
            role,
            zone_id,
            area_id,
            cell_id,
            is_active: true,
          }, { onConflict: 'id' });
        if (upsertErr) {
          return new Response(JSON.stringify({ error: upsertErr.message }), { status: 400, headers: corsHeaders });
        }

        return new Response(JSON.stringify({ userId: found.id, updated: true, password: effectivePassword }), { status: 200, headers: corsHeaders });
      } catch (dupErr: any) {
        return new Response(JSON.stringify({ error: dupErr?.message || 'Duplicate handling failed' }), { status: 400, headers: corsHeaders });
      }
    }

    const authUser = created.user;
    if (!authUser) {
      return new Response(JSON.stringify({ error: 'User creation failed' }), { status: 400, headers: corsHeaders });
    }

    // 2) Insert profile row
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: authUser.id,
          name,
          phone,
          role,
          zone_id,
          area_id,
          cell_id,
          is_active: true,
        },
      ]);

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({ userId: authUser.id, password }),
      { status: 200, headers: corsHeaders },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: corsHeaders });
  }
});
