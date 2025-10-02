-- Add per-user recipients support for alerts
-- Run this in Supabase SQL Editor (or psql) before using the feature

-- 1) Add column for per-user recipients (UUID array)
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS recipient_user_ids UUID[];

-- Optional: GIN index for faster ANY() lookups on arrays
CREATE INDEX IF NOT EXISTS idx_alerts_recipient_user_ids
  ON public.alerts USING GIN (recipient_user_ids);

-- 2) Replace the existing view policy to respect recipients restriction
DROP POLICY IF EXISTS "View alerts policy" ON public.alerts;

CREATE POLICY "View alerts policy" ON public.alerts
  FOR SELECT USING (
    is_active = true AND (
      -- If no recipients specified, fall back to audience-based visibility
      (
        recipient_user_ids IS NULL AND (
          target_audience = 'all' OR
          (target_audience = 'super-admins' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin')) OR
          (target_audience = 'zone-leaders' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super-admin', 'zone-leader'))) OR
          (target_audience = 'area-leaders' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super-admin', 'zone-leader', 'area-leader'))) OR
          (target_audience = 'cell-leaders' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super-admin', 'zone-leader', 'area-leader', 'cell-leader')))
        )
      )
      OR
      -- If recipients are specified, only recipients (and super-admins) can view
      (
        recipient_user_ids IS NOT NULL AND (
          auth.uid() = ANY (recipient_user_ids) OR
          EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin')
        )
      )
    )
  );
