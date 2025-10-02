/* Gospel Gather Database Schema for Supabase
   Run this in your Supabase SQL Editor */

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('super-admin', 'zone-leader', 'area-leader', 'cell-leader')),
  zone_id UUID,
  area_id UUID,
  cell_id UUID,
  is_active BOOLEAN DEFAULT true,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Zones table
CREATE TABLE public.zones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES public.users(id),
  district_name TEXT,
  district_leader TEXT,
  district_pastor TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Areas table
CREATE TABLE public.areas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES public.users(id),
  district_name TEXT,
  district_leader TEXT,
  district_pastor TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cells table
CREATE TABLE public.cells (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES public.users(id),
  location TEXT,
  meeting_day TEXT,
  meeting_time TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table
CREATE TABLE public.members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cell_id UUID REFERENCES public.cells(id) ON DELETE CASCADE,
  date_joined DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings table
CREATE TABLE public.meetings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cell_id UUID REFERENCES public.cells(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  attendance_count INTEGER DEFAULT 0,
  offering_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'super-admins', 'zone-leaders', 'area-leaders', 'cell-leaders')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints for user zone/area/cell assignments
ALTER TABLE public.users ADD CONSTRAINT fk_users_zone FOREIGN KEY (zone_id) REFERENCES public.zones(id);
ALTER TABLE public.users ADD CONSTRAINT fk_users_area FOREIGN KEY (area_id) REFERENCES public.areas(id);
ALTER TABLE public.users ADD CONSTRAINT fk_users_cell FOREIGN KEY (cell_id) REFERENCES public.cells(id);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_zone_id ON public.users(zone_id);
CREATE INDEX idx_users_area_id ON public.users(area_id);
CREATE INDEX idx_users_cell_id ON public.users(cell_id);
CREATE INDEX idx_areas_zone_id ON public.areas(zone_id);
CREATE INDEX idx_cells_area_id ON public.cells(area_id);
CREATE INDEX idx_members_cell_id ON public.members(cell_id);
CREATE INDEX idx_meetings_cell_id ON public.meetings(cell_id);
CREATE INDEX idx_meetings_date ON public.meetings(date);
CREATE INDEX idx_alerts_target_audience ON public.alerts(target_audience);
CREATE INDEX idx_alerts_is_active ON public.alerts(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own data and admins can read all
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin'
  ));

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin'
  ));

-- Super admins can manage all data
CREATE POLICY "Super admins can manage zones" ON public.zones
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin'
  ));

CREATE POLICY "Zone leaders can view their zones" ON public.zones
  FOR SELECT USING (
    leader_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin')
  );

-- Similar policies for areas, cells, members, meetings, and alerts
CREATE POLICY "Manage areas policy" ON public.areas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super-admin')) OR
    (leader_id = auth.uid()) OR
    (zone_id IN (SELECT id FROM public.zones WHERE leader_id = auth.uid()))
  );

CREATE POLICY "Manage cells policy" ON public.cells
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super-admin')) OR
    (leader_id = auth.uid()) OR
    (area_id IN (SELECT id FROM public.areas WHERE leader_id = auth.uid())) OR
    (area_id IN (SELECT a.id FROM public.areas a JOIN public.zones z ON a.zone_id = z.id WHERE z.leader_id = auth.uid()))
  );

CREATE POLICY "Manage members policy" ON public.members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super-admin')) OR
    (cell_id IN (SELECT id FROM public.cells WHERE leader_id = auth.uid())) OR
    (cell_id IN (SELECT c.id FROM public.cells c JOIN public.areas a ON c.area_id = a.id WHERE a.leader_id = auth.uid())) OR
    (cell_id IN (SELECT c.id FROM public.cells c JOIN public.areas a ON c.area_id = a.id JOIN public.zones z ON a.zone_id = z.id WHERE z.leader_id = auth.uid()))
  );

CREATE POLICY "Manage meetings policy" ON public.meetings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super-admin')) OR
    (cell_id IN (SELECT id FROM public.cells WHERE leader_id = auth.uid())) OR
    (cell_id IN (SELECT c.id FROM public.cells c JOIN public.areas a ON c.area_id = a.id WHERE a.leader_id = auth.uid())) OR
    (cell_id IN (SELECT c.id FROM public.cells c JOIN public.areas a ON c.area_id = a.id JOIN public.zones z ON a.zone_id = z.id WHERE z.leader_id = auth.uid()))
  );

CREATE POLICY "View alerts policy" ON public.alerts
  FOR SELECT USING (
    is_active = true AND (
      target_audience = 'all' OR
      (target_audience = 'super-admins' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin')) OR
      (target_audience = 'zone-leaders' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super-admin', 'zone-leader'))) OR
      (target_audience = 'area-leaders' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super-admin', 'zone-leader', 'area-leader'))) OR
      (target_audience = 'cell-leaders' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super-admin', 'zone-leader', 'area-leader', 'cell-leader')))
    )
  );

CREATE POLICY "Manage alerts policy" ON public.alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super-admin')
  );

-- Functions to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON public.zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cells_updated_at BEFORE UPDATE ON public.cells FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
-- This will be populated after authentication is set up
