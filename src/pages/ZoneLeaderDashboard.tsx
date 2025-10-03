import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
// Using Supabase row types; we will rely on shapes from DataContext
// import type { Zone, Area, Cell, Meeting, User } from '@/lib/supabase';
import { CreateUserModal } from '@/components/CreateUserModal';
import { Users, MapPin, Calendar, DollarSign, Plus, Edit, Trash2, FileText, Download, LogOut, BarChart3, TrendingUp, PieChart, Eye } from 'lucide-react';
import { formatDistanceStrict } from 'date-fns';
import { zoneService, authService } from '@/services/supabaseService';
import { generateMemorablePassword } from '@/lib/utils';
import AlertNotifications from '@/components/AlertNotifications';

const ZoneLeaderDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { 
    zones, areas, cells, meetings, users, members,
    addArea, updateArea, deleteArea, addUser, updateUser, refreshData } = useData();

  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showEditAreaModal, setShowEditAreaModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any | null>(null);
  const [showViewAreaModal, setShowViewAreaModal] = useState(false);
  const [viewingArea, setViewingArea] = useState<any | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  // Assign Area Leader state
  const [showAssignAreaLeaderDialog, setShowAssignAreaLeaderDialog] = useState(false);
  const [assignForArea, setAssignForArea] = useState<any>(null);
  const [assignMode, setAssignMode] = useState<'existing' | 'new'>('existing');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newLeaderName, setNewLeaderName] = useState<string>('');
  const [newLeaderPhone, setNewLeaderPhone] = useState<string>('');
  const [newLeaderEmail, setNewLeaderEmail] = useState<string>('');
  const [assignedCreds, setAssignedCreds] = useState<{email: string; password: string} | null>(null);
  const [showCredsDialog, setShowCredsDialog] = useState(false);
  const [createLeaderAccount, setCreateLeaderAccount] = useState<boolean>(false);
  // Failsafe to ensure credentials dialog is shown whenever we have fresh credentials
  useEffect(() => {
    if (assignedCreds && !showCredsDialog) {
      setShowCredsDialog(true);
    }
  }, [assignedCreds]);
  const [newArea, setNewArea] = useState({
    name: '',
    leaderName: '',
    leaderEmail: '',
    leaderPhone: '',
    districtName: '',
    districtleader: '',
    districtPastor: '',
    description: '',
    status: 'active'
  });

  // Get current zone by leader assignment or user's zone_id
  const currentZone = zones.find((zone: any) => zone.leader_id === user?.id) || zones.find((zone) => zone.id === (user as any)?.zone_id);
  const [fetchedZone, setFetchedZone] = useState<any | null>(null);
  const zoneToUse: any = currentZone || fetchedZone;

  // Hierarchical data for effective zone
  const zoneAreas = areas.filter((area: any) => area.zone_id === zoneToUse?.id);
  const zoneCells = cells.filter((cell: any) => zoneAreas.some((area) => area.id === cell.area_id));
  const zoneMeetings = meetings.filter((meeting: any) => zoneCells.some((cell) => cell.id === meeting.cell_id));

  // Calculate statistics
  const totalAreas = zoneAreas.length;
  const totalCells = zoneCells.length;
  const totalMembers = members.filter((m: any) => zoneCells.some((c) => c.id === m.cell_id)).length;
  const totalMeetings = zoneMeetings.length;
  const totalOfferings = zoneMeetings.reduce((sum: number, meeting: any) => sum + (meeting.offering_amount || 0), 0);
  const totalVisitors = zoneMeetings.reduce((sum: number, m: any) => sum + ((m as any).visitors_count || 0), 0);
  const totalConverts = zoneMeetings.reduce((sum: number, m: any) => sum + ((m as any).converts_count || 0), 0);
  const totalFollowups = zoneMeetings.reduce((sum: number, m: any) => sum + ((m as any).followups_count || 0), 0);
  const totalVisits = zoneMeetings.reduce((sum: number, m: any) => sum + ((m as any).visits_count || 0), 0);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await refreshData();
      } catch {}
      const zid = (user as any)?.zone_id;
      if (!cancelled && !currentZone && zid) {
        try {
          const z = await zoneService.getZoneById(zid);
          setFetchedZone(z);
        } catch {}
      }
      if (!cancelled && !currentZone && !zid) {
        toast({
          title: "No Zone Assigned",
          description: "You don't have a zone assigned yet. Please contact your administrator.",
          variant: "destructive",
        });
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openAssignAreaLeader = (area: any) => {
    setAssignForArea(area);
    // Default to 'Create New' to enable auto password generation flow
    setAssignMode('new');
    setSelectedUserId('');
    setNewLeaderName('');
    setNewLeaderPhone('');
    setNewLeaderEmail('');
    setShowAssignAreaLeaderDialog(true);
  };

  const genPassword = (name: string) => generateMemorablePassword(name);

  const handleAssignAreaLeaderSave = async () => {
    if (!assignForArea) return;
    try {
      if (assignMode === 'existing') {
        if (!selectedUserId) {
          toast({ title: 'Select a User', description: 'Please select a user to assign as area leader.', variant: 'destructive' });
          return;
        }
        const prevLeaderId = (assignForArea as any)?.leader_id;
        if (prevLeaderId && prevLeaderId !== selectedUserId) {
          await updateUser(prevLeaderId, { area_id: null } as any);
        }
        await updateArea(assignForArea.id, { leader_id: selectedUserId } as any);
        await updateUser(selectedUserId, { area_id: assignForArea.id, zone_id: currentZone?.id } as any);
        toast({ title: 'Leader Assigned', description: 'Area leader has been assigned successfully.' });
      } else {
        if (!newLeaderName.trim() || !newLeaderEmail.trim()) {
          toast({ title: 'Validation Error', description: 'Please enter the leader name and email.', variant: 'destructive' });
          return;
        }
        const pwd = genPassword(newLeaderName);
        try {
          // Provision area leader via Edge Function (prod) with dev fallback
          const res: any = await authService.provisionUser({
            email: newLeaderEmail.trim(),
            password: pwd,
            name: newLeaderName.trim(),
            phone: newLeaderPhone || undefined,
            role: 'area-leader' as any,
            zone_id: currentZone?.id,
            area_id: assignForArea.id,
          });

          const createdUserId = res?.userId || res?.user?.id;
          const shownPwd = (res?.password as string) || pwd;

          // Always show credentials immediately after provisioning
          setShowAssignAreaLeaderDialog(false);
          try {
            await navigator.clipboard.writeText(`Email: ${newLeaderEmail}\nPassword: ${shownPwd}`);
            toast({ title: 'Leader Created', description: `Credentials copied. Email: ${newLeaderEmail} | Password: ${shownPwd}` });
          } catch {
            toast({ title: 'Leader Created', description: `Credentials — Email: ${newLeaderEmail} | Password: ${shownPwd}` });
          }
          setAssignedCreds({ email: newLeaderEmail.trim(), password: shownPwd });
          setShowCredsDialog(true);

          // Best-effort: link leader to area. Do not block credentials on any failure
          if (createdUserId) {
            try {
              const prevLeaderId = (assignForArea as any)?.leader_id;
              if (prevLeaderId && prevLeaderId !== createdUserId) {
                await updateUser(prevLeaderId, { area_id: null } as any);
              }
              await updateArea(assignForArea.id, { leader_id: createdUserId } as any);
              try {
                await updateUser(createdUserId, { area_id: assignForArea.id, zone_id: currentZone?.id } as any);
              } catch (upErr:any) {
                console.warn('updateUser failed (likely RLS). Continuing.', upErr);
              }
            } catch (linkErr: any) {
              console.warn('Failed to link new leader to area. Continuing.', linkErr);
            }
          }
        } catch (provErr: any) {
          const msg = provErr?.message || provErr?.error_description || 'Leader provisioning failed.';
          toast({ title: 'Leader provisioning failed', description: msg, variant: 'destructive' });
        }
      }
    } finally {
      setShowAssignAreaLeaderDialog(false);
      setAssignForArea(null);
      setNewLeaderEmail('');
    }
  };

  const resetAreaForm = () => {
    setNewArea({
      name: '',
      leaderName: '',
      leaderEmail: '',
      leaderPhone: '',
      districtName: '',
      districtleader: '',
      districtPastor: '',
      description: '',
      status: 'active'
    });
    setCreateLeaderAccount(false);
  };

  const handleAddArea = () => {
    resetAreaForm();
    setSelectedArea(null); // ensure create mode
    setAssignedCreds(null); // clear any stale credentials
    setShowAddAreaModal(true);
  };

  const handleEditArea = (area: any) => {
    setSelectedArea(area);
    setNewArea({
      name: area.name || '',
      leaderName: (users.find(u => (u as any).id === (area as any).leader_id)?.name) || '',
      leaderEmail: '',
      leaderPhone: users.find(u => (u as any).id === (area as any).leader_id)?.phone || '',
      districtName: (area as any).district_name || (area as any).districtName || '',
      districtleader: (area as any).district_leader || (area as any).districtleader || '',
      districtPastor: (area as any).district_pastor || (area as any).districtPastor || '',
      description: area.description || '',
      status: area.status || 'active'
    });
    setShowEditAreaModal(true);
  };

  const handleViewArea = (area: any) => {
    setViewingArea(area);
    setShowViewAreaModal(true);
  };

  const handleSaveArea = async () => {
    if (!newArea.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter an area name",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure we know which zone to attach this area to
    if (!zoneToUse?.id) {
      toast({
        title: "No Zone Assigned",
        description: "You don't have a zone assigned yet. Contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedArea) {
        // Update existing area
        const updatedArea: any = {
          name: newArea.name,
          description: newArea.description,
          district_name: newArea.districtName,
          district_leader: newArea.districtleader,
          district_pastor: newArea.districtPastor,
          status: newArea.status as 'active' | 'inactive',
        };
        await updateArea((selectedArea as any).id, updatedArea);
        setShowEditAreaModal(false);
        toast({
          title: "Success",
          description: "Area updated successfully",
        });
      } else {
        // Create new area first; then (optionally) provision/link leader
        let areaLeaderId: string | undefined = undefined;
        let pendingCreds: { email: string; password: string } | null = null;

        const areaData = {
          name: newArea.name,
          zone_id: zoneToUse.id,
          district_name: newArea.districtName,
          district_leader: newArea.districtleader,
          district_pastor: newArea.districtPastor,
          description: newArea.description,
          status: newArea.status as 'active' | 'inactive',
        } as any;

        // Create the area in DB (this must not be blocked by leader provisioning)
        const createdArea = await addArea(areaData);
        if (!createdArea || !(createdArea as any).id) {
          throw new Error('Area creation did not return an ID.');
        }

        // If leader info is provided, provision NOW and then link to the created area
        if (createLeaderAccount && newArea.leaderName && newArea.leaderEmail) {
          try {
            const pwd = genPassword(newArea.leaderName);
            const res: any = await authService.provisionUser({
              email: newArea.leaderEmail.trim(),
              password: pwd,
              name: newArea.leaderName.trim(),
              phone: newArea.leaderPhone || undefined,
              role: 'area-leader' as any,
              zone_id: zoneToUse.id,
              area_id: (createdArea as any).id,
            });
            areaLeaderId = res?.userId || res?.user?.id;
            if (areaLeaderId) {
              await updateArea((createdArea as any).id, { leader_id: areaLeaderId } as any);
              try {
                await updateUser(areaLeaderId, { area_id: (createdArea as any).id } as any);
              } catch (upErr: any) {
                console.warn('updateUser failed (likely RLS in dev). Continuing.', upErr);
              }
            }
            const shownPwd = (res?.password as string) || pwd;
            try {
              await navigator.clipboard.writeText(`Email: ${newArea.leaderEmail}\nPassword: ${shownPwd}`);
              toast({ title: 'Leader Created', description: `Credentials copied. Email: ${newArea.leaderEmail} | Password: ${shownPwd}` });
            } catch {
              toast({ title: 'Leader Created', description: `Credentials — Email: ${newArea.leaderEmail} | Password: ${shownPwd}` });
            }
            pendingCreds = { email: newArea.leaderEmail.trim(), password: shownPwd };
            setAssignedCreds(pendingCreds);
          } catch (provErr: any) {
            const msg = provErr?.message || provErr?.error_description || 'Leader provisioning failed. You can assign later.';
            toast({ title: 'Leader provisioning skipped', description: msg, variant: 'destructive' });
            areaLeaderId = undefined;
            pendingCreds = null;
          }
        }

        // Refresh data to ensure UI shows the new area immediately
        await refreshData().catch(() => {});
        setShowAddAreaModal(false);
        // If we have pending credentials (because a new leader was created), show them now
        if (pendingCreds) {
          setAssignedCreds(pendingCreds);
          setShowCredsDialog(true);
        }
        toast({
          title: "Success",
          description: "Area created successfully",
        });
      }
      resetAreaForm();
      setSelectedArea(null);
    } catch (e: any) {
      console.error('Save area error:', e);
      toast({
        title: "Failed to save area",
        description: (e && (e.message || e.error_description)) ? (e.message || e.error_description) : 'An unexpected error occurred while saving the area.',
        variant: "destructive",
      });
    }
  };

  const handleDeleteArea = (areaId: string) => {
    if (confirm("Are you sure you want to delete this area? This will also delete all cells in this area.")) {
      deleteArea(areaId);
      toast({
        title: "Success",
        description: "Area deleted successfully",
      });
    }
  };

  const generateAttendanceReport = async () => {
    await refreshData?.();
    const totalVisitors = zoneMeetings.reduce((s: number, m: any) => s + ((m as any).visitors_count || 0), 0);
    const totalConverts = zoneMeetings.reduce((s: number, m: any) => s + ((m as any).converts_count || 0), 0);
    const totalFollowups = zoneMeetings.reduce((s: number, m: any) => s + ((m as any).followups_count || 0), 0);
    const totalVisits = zoneMeetings.reduce((s: number, m: any) => s + ((m as any).visits_count || 0), 0);
    const reportData = {
      type: 'attendance',
      title: 'Zone Attendance Report',
      zoneName: currentZone?.name || 'Unknown Zone',
      period: `Generated on ${new Date().toLocaleDateString()}`,
      summary: {
        totalAreas,
        totalCells,
        totalMembers,
        totalMeetings,
        averageAttendance: zoneMeetings.length > 0 ? 
          Math.round(zoneMeetings.reduce((sum: number, m: any) => sum + (m.attendance_count || 0), 0) / zoneMeetings.length) : 0,
        totalVisitors,
        totalConverts,
        totalFollowups,
        totalVisits,
      },
      data: zoneAreas.map((area: any) => {
        const areaCells = zoneCells.filter((c: any) => c.area_id === area.id);
        const cellIds = areaCells.map((c: any) => c.id);
        const areaMeetings = zoneMeetings.filter((m: any) => cellIds.includes(m.cell_id));
        return {
          name: area.name,
          leader: users.find(u => (u as any).id === (area as any).leader_id)?.name || 'Not assigned',
          cells: areaCells.length,
          members: members.filter((mem: any) => cellIds.includes(mem.cell_id)).length,
          meetings: areaMeetings.length,
          averageAttendance: areaMeetings.length > 0 ? 
            Math.round(areaMeetings.reduce((sum: number, m: any) => sum + (m.attendance_count || 0), 0) / areaMeetings.length) : 0
        };
      })
    };

    setReportData(reportData);
    setSelectedReport('attendance');
  };

  const generateGrowthReport = () => {
    // Helper: Monday-start week label and key
    const getWeekInfo = (d: Date) => {
      const date = new Date(d);
      const day = (date.getDay() + 6) % 7; // Monday=0
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const label = `Week of ${date.toLocaleDateString()}`;
      return { key, label };
    };

    const weekly: Record<string, { week: string; meetings: number; attendees: number; offerings: number; activeCells: number; newMembers: number; visitors: number; converts: number; followups: number; visits: number }> = {};

    // Aggregate meetings for the entire zone by week
    for (const m of zoneMeetings as any[]) {
      const info = getWeekInfo(new Date((m as any).date));
      if (!weekly[info.key]) weekly[info.key] = { week: info.label, meetings: 0, attendees: 0, offerings: 0, activeCells: 0, newMembers: 0, visitors: 0, converts: 0, followups: 0, visits: 0 };
      weekly[info.key].meetings += 1;
      weekly[info.key].attendees += ((m as any).attendance_count || 0);
      weekly[info.key].offerings += ((m as any).offering_amount || 0);
      weekly[info.key].visitors += ((m as any).visitors_count || 0);
      weekly[info.key].converts += ((m as any).converts_count || 0);
      weekly[info.key].followups += ((m as any).followups_count || 0);
      weekly[info.key].visits += ((m as any).visits_count || 0);
    }

    // Count unique cells per week as activeCells and new members per week for zone
    const zoneCellIds = new Set(zoneCells.map((c: any) => c.id));
    for (const m of zoneMeetings as any[]) {
      const info = getWeekInfo(new Date((m as any).date));
      if (!weekly[info.key]) weekly[info.key] = { week: info.label, meetings: 0, attendees: 0, offerings: 0, activeCells: 0, newMembers: 0, visitors: 0, converts: 0, followups: 0, visits: 0 };
      // We'll compute activeCells later by scanning meetings set
    }
    // Derive activeCells by week via cell_id set
    const cellsPerWeek: Record<string, Set<string>> = {};
    for (const m of zoneMeetings as any[]) {
      const info = getWeekInfo(new Date((m as any).date));
      if (!cellsPerWeek[info.key]) cellsPerWeek[info.key] = new Set<string>();
      cellsPerWeek[info.key].add(String((m as any).cell_id));
    }
    Object.keys(cellsPerWeek).forEach(k => {
      if (!weekly[k]) return;
      weekly[k].activeCells = cellsPerWeek[k].size;
    });

    // New members per week (based on members.date_joined and members belonging to zone cells)
    for (const mem of members as any[]) {
      if (!zoneCellIds.has((mem as any).cell_id)) continue;
      const joined = (mem as any).date_joined;
      if (!joined) continue;
      const info = getWeekInfo(new Date(joined));
      if (!weekly[info.key]) weekly[info.key] = { week: info.label, meetings: 0, attendees: 0, offerings: 0, activeCells: 0, newMembers: 0, visitors: 0, converts: 0, followups: 0, visits: 0 };
      weekly[info.key].newMembers += 1;
    }

    const reportData = {
      type: 'growth',
      title: 'Zone Growth Report',
      zoneName: currentZone?.name || 'Unknown Zone',
      period: 'Weekly Breakdown',
      summary: {
        totalAreas,
        totalCells,
        totalMembers,
        totalMeetings,
        totalGrowth: Object.values(weekly).reduce((s, w) => s + (w.newMembers || 0), 0),
        totalVisitors,
        totalConverts,
        totalFollowups,
        totalVisits,
        averageAttendance: zoneMeetings.length > 0 ? Math.round(zoneMeetings.reduce((sum: number, m: any) => sum + (m.attendance_count || 0), 0) / zoneMeetings.length) : 0,
      },
      data: Object.keys(weekly).sort().map((k) => weekly[k])
    } as any;

    setReportData(reportData);
    setSelectedReport('growth');
  };

  const generateOfferingReport = () => {
    const reportData = {
      type: 'offering',
      title: 'Zone Offering Report',
      zoneName: currentZone?.name || 'Unknown Zone',
      period: `Generated on ${new Date().toLocaleDateString()}`,
      summary: {
        totalAreas,
        totalCells,
        totalMembers,
        totalMeetings,
        totalOfferings
      },
      data: zoneAreas.map((area: any) => {
        const areaCells = zoneCells.filter((c: any) => c.area_id === area.id);
        const cellIds = areaCells.map((c: any) => c.id);
        const areaMeetings = zoneMeetings.filter((m: any) => cellIds.includes(m.cell_id));
        const areaOfferings = areaMeetings.reduce((sum: number, m: any) => sum + (m.offering_amount || 0), 0);
        return {
          name: area.name,
          leader: users.find(u => (u as any).id === (area as any).leader_id)?.name || 'Not assigned',
          cells: areaCells.length,
          members: members.filter((mem: any) => cellIds.includes(mem.cell_id)).length,
          meetings: areaMeetings.length,
          totalOfferings: areaOfferings
        };
      })
    };

    setReportData(reportData);
    setSelectedReport('offering');
  };

  const generateAreaPerformanceReport = () => {
    const reportData = {
      type: 'performance',
      title: 'Zone Performance Report',
      zoneName: currentZone?.name || 'Unknown Zone',
      period: `Generated on ${new Date().toLocaleDateString()}`,
      summary: {
        totalAreas,
        totalCells,
        totalMembers,
        totalMeetings,
        totalOfferings
      },
      data: zoneAreas.map((area: any) => {
        const areaCells = zoneCells.filter((c: any) => c.area_id === area.id);
        const cellIds = areaCells.map((c: any) => c.id);
        const areaMeetings = zoneMeetings.filter((m: any) => cellIds.includes(m.cell_id));
        const areaOfferings = areaMeetings.reduce((sum: number, m: any) => sum + (m.offering_amount || 0), 0);
        return {
          name: area.name,
          leader: users.find(u => (u as any).id === (area as any).leader_id)?.name || 'Not assigned',
          cells: areaCells.length,
          members: members.filter((mem: any) => cellIds.includes(mem.cell_id)).length,
          meetings: areaMeetings.length,
          totalOfferings: areaOfferings,
          averageAttendance: areaMeetings.length > 0 ? 
            Math.round(areaMeetings.reduce((sum: number, m: any) => sum + (m.attendance_count || 0), 0) / areaMeetings.length) : 0
        };
      })
    };

    setReportData(reportData);
    setSelectedReport('performance');
  };

  const exportReport = () => {
    if (!reportData) return;
    let csvContent = '';
    if (reportData.type === 'growth') {
      const headers = ['Week', 'Meetings', 'Attendees', 'Offerings', 'Active Cells', 'New Members', 'Visitors', 'Converts', 'Follow-ups', 'Visits'];
      const rows = reportData.data.map((row: any) => [row.week, row.meetings, row.attendees, row.offerings, row.activeCells, row.newMembers || 0, row.visitors || 0, row.converts || 0, row.followups || 0, row.visits || 0]);
      csvContent = [headers, ...rows].map((r: any[]) => r.join(',')).join('\n');
    } else {
      const headers = ['Area Name', 'Leader', 'Cells', 'Members', 'Meetings', 'Total Offerings', 'Avg Attendance'];
      const rows = reportData.data.map((area: any) => [
        area.name, area.leader, area.cells, area.members, area.meetings, area.totalOfferings, area.averageAttendance
      ]);
      csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.title.replace(/\s+/g, '_')}_${zoneToUse?.name || 'Zone'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!currentZone && !fetchedZone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-foreground mb-2">No Zone Assigned</h1>
          <p className="text-muted-foreground mb-4">
            You don't have a zone assigned yet. Please contact your administrator.
          </p>
          <div className="mx-auto mb-6 max-w-xl text-left text-xs p-3 rounded border bg-muted/30">
            <p className="font-semibold mb-1">Debug Info (temporary)</p>
            <p>User ID: {(user as any)?.id || 'n/a'}</p>
            <p>User zone_id: {(user as any)?.zone_id || 'n/a'}</p>
            <p>Zones loaded: {zones.length}</p>
            <p>Zone IDs: {zones.map((z:any)=>z.id).join(', ') || 'none'}</p>
            <p>Leader IDs: {zones.map((z:any)=>z.leader_id || 'null').join(', ') || 'none'}</p>
          </div>
          <Button onClick={() => navigate("/")}> 
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Zone Leader Dashboard
            </h1>
            <p className="text-muted-foreground">
              Zone: {zoneToUse?.name || 'Unknown Zone'} • Leader: {user?.name}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Alert Notifications */}
        <div className="mb-8">
          <AlertNotifications userRole="zone-leader" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Areas</p>
                  <p className="text-2xl font-bold text-foreground">{totalAreas}</p>
                </div>
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cells</p>
                  <p className="text-2xl font-bold text-foreground">{totalCells}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold text-foreground">{totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Meetings</p>
                  <p className="text-2xl font-bold text-foreground">{totalMeetings}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Offerings</p>
                  <p className="text-2xl font-bold text-foreground">₵{totalOfferings.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="areas">Areas</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Zone Information</CardTitle>
                <CardDescription>Overview of your zone's performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Zone Name</p>
                    <p className="font-medium text-foreground">{zoneToUse?.name || 'Unknown Zone'}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Active Areas</p>
                    <p className="font-medium text-foreground">{totalAreas}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Cells</p>
                    <p className="font-medium text-foreground">{totalCells}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Members</p>
                    <p className="font-medium text-foreground">{totalMembers}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Area Performance</h3>
                  <div className="space-y-3">
                    {zoneAreas.map((area: any) => {
                      const areaCells = zoneCells.filter((c: any) => c.area_id === area.id);
                      const cellIds = areaCells.map((c: any) => c.id);
                      const areaMeetings = zoneMeetings.filter((m: any) => cellIds.includes(m.cell_id));
                      const areaOfferings = areaMeetings.reduce((sum: number, m: any) => sum + (m.offering_amount || 0), 0);
                      return (
                        <div key={area.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{area.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {areaCells.length} cells • {areaMeetings.length} meetings
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₵{areaOfferings.toLocaleString()}</p>
                            <Badge variant={area.status === 'active' ? 'default' : 'secondary'}>
                              {area.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="areas" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Zone Areas</h2>
                    <p className="text-muted-foreground">Manage areas within your zone</p>
                  </div>
                  <div className="flex gap-2">
                    {user?.role === 'super-admin' && (
                      <Button 
                        onClick={() => setShowCreateUserModal(true)}
                        variant="outline"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Create User
                      </Button>
                    )}
                    <Button onClick={handleAddArea}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Area
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {zoneAreas.length > 0 ? (
                  <div className="space-y-3">
                    {zoneAreas.map((area: any) => {
                      const areaCells = zoneCells.filter((c: any) => c.area_id === area.id);
                      return (
                        <div key={area.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div>
                            <p className="font-medium">{area.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Leader: {users.find(u => (u as any).id === (area as any).leader_id)?.name || 'Not assigned'} • {areaCells.length} cells
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={area.status === 'active' ? 'default' : 'secondary'}>
                              {area.status}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => handleViewArea(area)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(user?.role === 'super-admin' || user?.role === 'zone-leader') && !(area as any).leader_id && (
                              <Button variant="outline" size="sm" onClick={() => openAssignAreaLeader(area)}>
                                Assign Leader
                              </Button>
                            )}
                            {(user?.role === 'super-admin' || user?.role === 'zone-leader') && !!(area as any).leader_id && (
                              <Button variant="outline" size="sm" onClick={() => openAssignAreaLeader(area)}>
                                Change Leader
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleEditArea(area)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteArea(area.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No areas created yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start by adding your first area
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Meetings</CardTitle>
                <CardDescription>Overview of recent meetings in your zone</CardDescription>
              </CardHeader>
              <CardContent>
                {zoneMeetings.length > 0 ? (
                  <div className="space-y-3">
                    {zoneMeetings.slice(0, 10).map((meeting: any) => {
                      const cell = zoneCells.find((c: any) => c.id === meeting.cell_id);
                      const area = zoneAreas.find((a: any) => a.id === cell?.area_id);
                      return (
                        <div key={meeting.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div>
                            <p className="font-medium">{cell?.name || 'Unknown Cell'}</p>
                            <p className="text-sm text-muted-foreground">
                              {area?.name} • {new Date(meeting.date).toLocaleDateString()} • {new Date(meeting.created_at).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(meeting.attendance_count || 0)} attendees
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₵{(meeting.offering_amount || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No meetings recorded yet</p>
                    <p className="text-sm text-muted-foreground">
                      Meetings will appear here once area leaders start recording them
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {!selectedReport ? (
              <Card>
                <CardHeader>
                  <CardTitle>Zone Reports</CardTitle>
                  <CardDescription>Generate comprehensive reports for your zone</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                    variant="outline"
                    onClick={generateAttendanceReport}
                  >
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Generate Attendance Report</p>
                    </div>
                  </Button>
                  <Button 
                    className="w-full h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                    variant="outline"
                    onClick={generateGrowthReport}
                  >
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Generate Growth Report</p>
                    </div>
                  </Button>
                  <Button 
                    className="w-full h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                    variant="outline"
                    onClick={generateOfferingReport}
                  >
                    <div className="text-center">
                      <PieChart className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Generate Offering Report</p>
                    </div>
                  </Button>
                  <Button 
                    className="w-full h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                    variant="outline"
                    onClick={generateAreaPerformanceReport}
                  >
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Generate Area Performance Report</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{reportData?.title}</CardTitle>
                      <CardDescription>
                        {reportData?.zoneName} • {reportData?.period}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => setSelectedReport(null)}>
                        Back to Reports
                      </Button>
                      <Button onClick={exportReport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reportData?.type === 'growth' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{reportData?.summary.totalAreas}</p>
                          <p className="text-sm text-muted-foreground">Total Areas</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{reportData?.summary.totalCells}</p>
                          <p className="text-sm text-muted-foreground">Total Cells</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{reportData?.summary.totalMembers}</p>
                          <p className="text-sm text-muted-foreground">Total Members</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{reportData?.summary.totalMeetings}</p>
                          <p className="text-sm text-muted-foreground">Total Meetings</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{reportData?.summary.totalGrowth}</p>
                          <p className="text-sm text-muted-foreground">Total Growth</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{reportData?.summary.totalVisitors || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Visitors</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-green-700">{reportData?.summary.totalConverts || 0}</p>
                          <p className="text-sm text-muted-foreground">New Converts</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{reportData?.summary.totalFollowups || 0}</p>
                          <p className="text-sm text-muted-foreground">Follow-ups</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-slate-700">{reportData?.summary.totalVisits || 0}</p>
                          <p className="text-sm text-muted-foreground">Visits Made</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Weekly Breakdown</h3>
                        {reportData?.data.map((row: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{row.week}</p>
                              <p className="text-sm text-muted-foreground">{row.meetings} meetings • {row.attendees} attendees</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">₵{(row.offerings || 0).toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">{row.activeCells} active cells • {row.newMembers || 0} new members</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : reportData?.type === 'attendance' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{reportData?.summary.totalAreas}</p>
                          <p className="text-sm text-muted-foreground">Total Areas</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{reportData?.summary.totalCells}</p>
                          <p className="text-sm text-muted-foreground">Total Cells</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{reportData?.summary.totalMembers}</p>
                          <p className="text-sm text-muted-foreground">Total Members</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{reportData?.summary.totalMeetings}</p>
                          <p className="text-sm text-muted-foreground">Total Meetings</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{reportData?.summary.averageAttendance}</p>
                          <p className="text-sm text-muted-foreground">Avg Attendance</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{reportData?.summary.totalVisitors || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Visitors</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-green-700">{reportData?.summary.totalConverts || 0}</p>
                          <p className="text-sm text-muted-foreground">New Converts</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{reportData?.summary.totalFollowups || 0}</p>
                          <p className="text-sm text-muted-foreground">Follow-ups</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-slate-700">{reportData?.summary.totalVisits || 0}</p>
                          <p className="text-sm text-muted-foreground">Visits Made</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Area Attendance Details</h3>
                        {reportData?.data.map((area: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{area.name}</p>
                              <p className="text-sm text-muted-foreground">{area.cells} cells • {area.members} members • {area.meetings} meetings</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{area.averageAttendance}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{reportData?.summary.totalAreas}</p>
                          <p className="text-sm text-muted-foreground">Total Areas</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{reportData?.summary.totalCells}</p>
                          <p className="text-sm text-muted-foreground">Total Cells</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{reportData?.summary.totalMembers}</p>
                          <p className="text-sm text-muted-foreground">Total Members</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{reportData?.summary.totalMeetings}</p>
                          <p className="text-sm text-muted-foreground">Total Meetings</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">₵{reportData?.summary.totalOfferings?.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Total Offerings</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Area Performance Details</h3>
                        {reportData?.data.map((area: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{area.name}</p>
                              <p className="text-sm text-muted-foreground">Leader: {area.leader} • {area.cells} cells • {area.members} members</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">₵{area.totalOfferings?.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">{area.meetings} meetings • {area.averageAttendance}% avg attendance</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Area Dialog */}
      <Dialog open={showAddAreaModal} onOpenChange={(open) => {
        setShowAddAreaModal(open);
        if (!open) {
          resetAreaForm();
          setSelectedArea(null);
          setAssignedCreds(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Area</DialogTitle>
            <DialogDescription>
              Create a new area in your zone
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Area Name</Label>
              <Input 
                type="text" 
                value={newArea.name} 
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Leader Name</Label>
              <Input 
                type="text" 
                value={newArea.leaderName} 
                onChange={(e) => setNewArea({ ...newArea, leaderName: e.target.value })}
              />
            </div>
            <div>
              <Label>Leader Email</Label>
              <Input 
                type="email" 
                value={newArea.leaderEmail} 
                onChange={(e) => setNewArea({ ...newArea, leaderEmail: e.target.value })}
              />
            </div>
            <div>
              <Label>Leader Phone</Label>
              <Input 
                type="tel" 
                value={newArea.leaderPhone} 
                onChange={(e) => setNewArea({ ...newArea, leaderPhone: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input id="createLeaderAccount" type="checkbox" checked={createLeaderAccount} onChange={(e) => setCreateLeaderAccount(e.target.checked)} />
              <Label htmlFor="createLeaderAccount">Create leader account and show password</Label>
            </div>
            <div>
              <Label>District Name</Label>
              <Input 
                type="text" 
                value={newArea.districtName} 
                onChange={(e) => setNewArea({ ...newArea, districtName: e.target.value })}
              />
            </div>
            <div>
              <Label>District Leader</Label>
              <Input 
                type="text" 
                value={newArea.districtleader} 
                onChange={(e) => setNewArea({ ...newArea, districtleader: e.target.value })}
              />
            </div>
            <div>
              <Label>District Pastor</Label>
              <Input 
                type="text" 
                value={newArea.districtPastor} 
                onChange={(e) => setNewArea({ ...newArea, districtPastor: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={newArea.description} 
                onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={newArea.status} 
                onValueChange={(value) => setNewArea({ ...newArea, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAreaModal(false)}>Cancel</Button>
            <Button onClick={handleSaveArea}>Add Area</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Area Dialog */}
      <Dialog open={showViewAreaModal} onOpenChange={setShowViewAreaModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Area Details</DialogTitle>
            <DialogDescription>Overview for {viewingArea?.name || ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{viewingArea?.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{viewingArea?.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">District Name</p>
                <p className="font-medium">{(viewingArea as any)?.district_name || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">District Leader</p>
                <p className="font-medium">{(viewingArea as any)?.district_leader || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">District Pastor</p>
                <p className="font-medium">{(viewingArea as any)?.district_pastor || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Description</p>
              <p className="font-medium whitespace-pre-wrap">{(viewingArea as any)?.description || '—'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewAreaModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Area Dialog */}
      <Dialog open={showEditAreaModal} onOpenChange={setShowEditAreaModal}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
            <DialogDescription>
              Update the details of this area
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Area Name</Label>
              <Input 
                type="text" 
                value={newArea.name} 
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Leader Name</Label>
              <Input 
                type="text" 
                value={newArea.leaderName} 
                onChange={(e) => setNewArea({ ...newArea, leaderName: e.target.value })}
              />
            </div>
            <div>
              <Label>Leader Email</Label>
              <Input 
                type="email" 
                value={newArea.leaderEmail} 
                onChange={(e) => setNewArea({ ...newArea, leaderEmail: e.target.value })}
              />
            </div>
            <div>
              <Label>Leader Phone</Label>
              <Input 
                type="tel" 
                value={newArea.leaderPhone} 
                onChange={(e) => setNewArea({ ...newArea, leaderPhone: e.target.value })}
              />
            </div>
            <div>
              <Label>District Name</Label>
              <Input 
                type="text" 
                value={newArea.districtName} 
                onChange={(e) => setNewArea({ ...newArea, districtName: e.target.value })}
              />
            </div>
            <div>
              <Label>District Leader</Label>
              <Input 
                type="text" 
                value={newArea.districtleader} 
                onChange={(e) => setNewArea({ ...newArea, districtleader: e.target.value })}
              />
            </div>
            <div>
              <Label>District Pastor</Label>
              <Input 
                type="text" 
                value={newArea.districtPastor} 
                onChange={(e) => setNewArea({ ...newArea, districtPastor: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={newArea.description} 
                onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={newArea.status} 
                onValueChange={(value) => setNewArea({ ...newArea, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditAreaModal(false)}>Cancel</Button>
            <Button onClick={handleSaveArea}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onUserCreated={(user, credentials) => {
          toast({
            title: "User Created Successfully",
            description: `Account created for ${user.name}. Credentials have been generated.`,
          });
        }}
        availableZones={[{ id: currentZone?.id || '', name: currentZone?.name || '' }]}
        availableAreas={zoneAreas.map((a: any) => ({ id: a.id, name: a.name, zoneId: (a as any).zone_id }))}
        preselectedZoneId={currentZone?.id}
      />

      {/* Assign Area Leader Dialog */}
      <Dialog open={showAssignAreaLeaderDialog} onOpenChange={setShowAssignAreaLeaderDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{assignForArea?.leader_id ? 'Change Area Leader' : 'Assign Area Leader'}</DialogTitle>
            <DialogDescription>
              {assignForArea ? `Assign a leader to area: ${assignForArea.name}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button variant={assignMode === 'existing' ? 'default' : 'outline'} size="sm" onClick={() => setAssignMode('existing')}>Select Existing</Button>
              <Button variant={assignMode === 'new' ? 'default' : 'outline'} size="sm" onClick={() => setAssignMode('new')}>Create New</Button>
            </div>
            {assignMode === 'existing' ? (
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an area leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u: any) => (u as any).role === 'area-leader')
                      .map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Leader Name</Label>
                  <Input value={newLeaderName} onChange={(e) => setNewLeaderName(e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={newLeaderEmail} onChange={(e) => setNewLeaderEmail(e.target.value)} placeholder="Email" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={newLeaderPhone} onChange={(e) => setNewLeaderPhone(e.target.value)} placeholder="Phone" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignAreaLeaderDialog(false)}>Cancel</Button>
            <Button onClick={handleAssignAreaLeaderSave}>Assign Leader</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={showCredsDialog} onOpenChange={setShowCredsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Login Credentials</DialogTitle>
            <DialogDescription>Share these with the leader so they can sign in.</DialogDescription>
          </DialogHeader>
          {assignedCreds && (
            <div className="space-y-3">
              <div>
                <Label>Email</Label>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/40">
                  <span className="font-mono text-sm">{assignedCreds.email}</span>
                  <Button size="sm" variant="outline" onClick={async () => {
                    await navigator.clipboard.writeText(assignedCreds.email);
                    toast({ title: 'Copied', description: 'Email copied to clipboard' });
                  }}>Copy</Button>
                </div>
              </div>
              <div>
                <Label>Password</Label>
                <div className="flex items-center justify-between p-2 rounded border bg-muted/40">
                  <span className="font-mono text-sm">{assignedCreds.password}</span>
                  <Button size="sm" variant="outline" onClick={async () => {
                    await navigator.clipboard.writeText(assignedCreds.password);
                    toast({ title: 'Copied', description: 'Password copied to clipboard' });
                  }}>Copy</Button>
                </div>
              </div>
              <div className="pt-2">
                <Button className="w-full" onClick={async () => {
                  await navigator.clipboard.writeText(`Email: ${assignedCreds.email}\nPassword: ${assignedCreds.password}`);
                  toast({ title: 'Copied', description: 'Credentials copied to clipboard' });
                }}>Copy Both</Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setShowCredsDialog(false); setAssignedCreds(null); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZoneLeaderDashboard;