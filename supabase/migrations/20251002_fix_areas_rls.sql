-- Fix RLS policies for public.areas so zone leaders can create/update areas
-- Safe to run multiple times in dev environments

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- Drop any legacy catch-all policy that might block INSERTs
DROP POLICY IF EXISTS "Manage areas policy" ON public.areas;
DROP POLICY IF EXISTS "areas_select" ON public.areas;
DROP POLICY IF EXISTS "areas_insert" ON public.areas;
DROP POLICY IF EXISTS "areas_update" ON public.areas;
DROP POLICY IF EXISTS "areas_delete" ON public.areas;

-- SELECT: super-admins, zone leaders for their zones, and assigned area leaders
CREATE POLICY "areas_select" ON public.areas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin') OR
    zone_id IN (SELECT id FROM public.zones WHERE leader_id = auth.uid()) OR
    leader_id = auth.uid()
  );

-- INSERT: super-admins and zone leaders can create areas in their zones
CREATE POLICY "areas_insert" ON public.areas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin') OR
    zone_id IN (SELECT id FROM public.zones WHERE leader_id = auth.uid())
  );

-- UPDATE: super-admins, zone leaders of the zone, or the assigned area leader
CREATE POLICY "areas_update" ON public.areas
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin') OR
    zone_id IN (SELECT id FROM public.zones WHERE leader_id = auth.uid()) OR
    leader_id = auth.uid()
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin') OR
    zone_id IN (SELECT id FROM public.zones WHERE leader_id = auth.uid()) OR
    leader_id = auth.uid()
  );

-- DELETE: super-admins and zone leaders for their zones
CREATE POLICY "areas_delete" ON public.areas
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin') OR
    zone_id IN (SELECT id FROM public.zones WHERE leader_id = auth.uid())
  );
