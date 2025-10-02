// @ts-nocheck
// Supabase Edge Function: admin-delete-zone
// Cascades deletion of a zone and all associated data and users.
// Production: verify_jwt should be TRUE. Only Super Admins can call this.
// Deploy: supabase functions deploy admin-delete-zone

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Missing environment configuration' }), { status: 500, headers: corsHeaders });
    }

    // Client bound to the caller's JWT for role check
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for privileged operations
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is super-admin
    const { data: userResp, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userResp?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const callerId = userResp.user.id;
    const { data: callerProfile, error: profileErr } = await admin
      .from('users')
      .select('id, role')
      .eq('id', callerId)
      .single();

    if (profileErr || callerProfile?.role !== 'super-admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: super-admin only' }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { zone_id } = body as { zone_id: string };
    if (!zone_id) {
      return new Response(JSON.stringify({ error: 'Missing zone_id' }), { status: 400, headers: corsHeaders });
    }

    // Collect IDs for cascade
    const { data: areas, error: areasErr } = await admin
      .from('areas')
      .select('id, leader_id')
      .eq('zone_id', zone_id);
    if (areasErr) throw areasErr;

    const areaIds = (areas || []).map((a: any) => a.id);

    // Cells in areas
    let cellIds: string[] = [];
    if (areaIds.length > 0) {
      const { data: cells, error: cellsErr } = await admin
        .from('cells')
        .select('id, leader_id')
        .in('area_id', areaIds);
      if (cellsErr) throw cellsErr;
      cellIds = (cells || []).map((c: any) => c.id);

      // Delete meetings, members, then cells
      if (cellIds.length > 0) {
        const { error: delMeetingsErr } = await admin.from('meetings').delete().in('cell_id', cellIds);
        if (delMeetingsErr) throw delMeetingsErr;

        const { error: delMembersErr } = await admin.from('members').delete().in('cell_id', cellIds);
        if (delMembersErr) throw delMembersErr;

        const { error: delCellsErr } = await admin.from('cells').delete().in('id', cellIds);
        if (delCellsErr) throw delCellsErr;
      }

      // Delete area leader profiles
      const { error: delAreaUsersErr } = await admin.from('users').delete().in('area_id', areaIds);
      if (delAreaUsersErr) throw delAreaUsersErr;

      // Nullify leaders and delete areas
      const { error: nullAreaLeadersErr } = await admin
        .from('areas')
        .update({ leader_id: null })
        .in('id', areaIds);
      if (nullAreaLeadersErr) throw nullAreaLeadersErr;

      const { error: delAreasErr } = await admin.from('areas').delete().in('id', areaIds);
      if (delAreasErr) throw delAreasErr;
    }

    // Delete zone leader profile(s)
    const { error: nullZoneLeaderFKErr } = await admin
      .from('zones')
      .update({ leader_id: null })
      .eq('id', zone_id);
    if (nullZoneLeaderFKErr) throw nullZoneLeaderFKErr;

    const { error: delZoneUsersErr } = await admin.from('users').delete().eq('zone_id', zone_id);
    if (delZoneUsersErr) throw delZoneUsersErr;

    // Finally delete zone
    const { error: delZoneErr } = await admin.from('zones').delete().eq('id', zone_id);
    if (delZoneErr) throw delZoneErr;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: corsHeaders });
  }
});
