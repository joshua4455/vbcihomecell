import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { 
  Church, Users, TrendingUp, DollarSign, LogOut, Plus, 
  Settings, Eye, Edit, Trash2, Shield, UserCheck, Calendar,
  Bell, AlertCircle, MessageSquare, Send, X, Download
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";
import AlertNotifications from "@/components/AlertNotifications";
import { Navigation } from "@/components/Navigation";
import { CreateUserModal } from "@/components/CreateUserModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authService, settingsService } from "@/services/supabaseService";
import { generateMemorablePassword } from "@/lib/utils";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { zones, areas, cells, meetings, alerts, users, members, addZone, updateZone, deleteZone, addArea, updateArea, deleteArea, addAlert, updateAlert, deleteAlert, addUser, addUserWithId, updateUser, deleteUser, refreshData } = useData();
  const { toast } = useToast();
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [newAlert, setNewAlert] = useState<{
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    target_audience: 'all' | 'super-admins' | 'zone-leaders' | 'area-leaders' | 'cell-leaders';
    priority: 'low' | 'normal' | 'high';
  }>({
    title: "",
    message: "",
    type: "info",
    target_audience: "all",
    priority: "normal"
  });
  // Optional: send alert to only specific users (requires alerts.recipient_user_ids column)
  const [sendToSpecificUsers, setSendToSpecificUsers] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);

  // Assign Zone Leader state
  const [showAssignZoneLeaderDialog, setShowAssignZoneLeaderDialog] = useState(false);
  const [assignForZone, setAssignForZone] = useState<any>(null);
  const [assignZoneMode, setAssignZoneMode] = useState<'existing' | 'new'>('existing');
  const [selectedZoneLeaderId, setSelectedZoneLeaderId] = useState<string>('');
  const [newZoneLeaderName, setNewZoneLeaderName] = useState('');
  const [newZoneLeaderPhone, setNewZoneLeaderPhone] = useState('');
  const [newZoneLeaderEmail, setNewZoneLeaderEmail] = useState('');
  const [assigningZoneLeader, setAssigningZoneLeader] = useState(false);
  const [assignedCreds, setAssignedCreds] = useState<{email: string; password: string} | null>(null);
  const [showCredsDialog, setShowCredsDialog] = useState(false);

  // User management filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [cellFilter, setCellFilter] = useState<string>('');
  const [zoneUnassignedOnly, setZoneUnassignedOnly] = useState<boolean>(false);
  const [areaUnassignedOnly, setAreaUnassignedOnly] = useState<boolean>(false);

  // Sync from Auth state
  const [showSyncFromAuth, setShowSyncFromAuth] = useState(false);
  const [syncAuthId, setSyncAuthId] = useState('');
  const [syncName, setSyncName] = useState('');
  const [syncPhone, setSyncPhone] = useState('');
  const [syncRole, setSyncRole] = useState<'super-admin' | 'zone-leader' | 'area-leader' | 'cell-leader'>('super-admin');
  const [syncZoneId, setSyncZoneId] = useState('');
  const [syncAreaId, setSyncAreaId] = useState('');
  const [syncCellId, setSyncCellId] = useState('');

  // User Management UI mode
  const [simpleUserUI, setSimpleUserUI] = useState(true);

  // Zone edit state
  const [showEditZoneModal, setShowEditZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [zoneForm, setZoneForm] = useState<{ name: string; description: string; status: 'active' | 'inactive' }>({ name: '', description: '', status: 'active' });

  const openAssignZoneLeader = (zone: any) => {
    setAssignForZone(zone);
    // Default to 'Create New' per requested UX
    setAssignZoneMode('new');
    setSelectedZoneLeaderId('');
    setNewZoneLeaderName('');
    setNewZoneLeaderPhone('');
    setNewZoneLeaderEmail('');
    setShowAssignZoneLeaderDialog(true);
  };

  const openEditZone = (zone: any) => {
    setEditingZone(zone);
    setZoneForm({ name: zone.name || '', description: (zone as any).description || '', status: (zone as any).status || 'active' });
    setShowEditZoneModal(true);
  };

  const handleSaveZone = async () => {
    if (!editingZone) return;
    await updateZone(editingZone.id, { name: zoneForm.name.trim(), description: zoneForm.description, status: zoneForm.status } as any);
    toast({ title: 'Zone Updated', description: 'Zone details saved.' });
    setShowEditZoneModal(false);
    setEditingZone(null);
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!window.confirm('Delete this zone? This cannot be undone.')) return;
    await deleteZone(zoneId);
    toast({ title: 'Zone Deleted', description: 'Zone removed successfully.' });
  };

  const genPassword = (name: string) => generateMemorablePassword(name);

  // Calculate zone statistics (derived from base tables)
  const zoneStats = zones.map((zone) => {
    const zAreas = areas.filter((a) => a.zone_id === zone.id);
    const areaIds = zAreas.map((a) => a.id);
    const zCells = cells.filter((c) => areaIds.includes(c.area_id));
    const cellIds = zCells.map((c) => c.id);
    const zMeetings = meetings.filter((m) => cellIds.includes(m.cell_id));
    const totalMembers = members.filter((m) => cellIds.includes(m.cell_id)).length;
    const totalAttendance = zMeetings.reduce((sum, m) => sum + (m.attendance_count || 0), 0);
    const totalOfferings = zMeetings.reduce((sum, m) => sum + (m.offering_amount || 0), 0);
    const averageAttendance = zMeetings.length > 0 ? Math.round(totalAttendance / zMeetings.length) : 0;
    const leaderName = users.find((u) => u.id === (zone as any).leader_id)?.name || 'Not assigned';
    return {
      ...zone,
      totalAreas: zAreas.length,
      totalCells: zCells.length,
      totalMembers,
      totalAttendance,
      totalOfferings,
      averageAttendance,
      leaderName,
    } as any;
  });
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [showAreaDetails, setShowAreaDetails] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  // Super Admin: Area view/edit state
  const [showViewAreaModalSA, setShowViewAreaModalSA] = useState(false);
  const [showEditAreaModalSA, setShowEditAreaModalSA] = useState(false);
  const [areaFormSA, setAreaFormSA] = useState<{ name: string; description: string; districtName: string; districtLeader: string; districtPastor: string; status: 'active' | 'inactive' }>({ name: '', description: '', districtName: '', districtLeader: '', districtPastor: '', status: 'active' });
  const [editingAreaSA, setEditingAreaSA] = useState<any>(null);

  const openViewAreaSA = (area: any) => {
    setSelectedArea(area);
    setShowViewAreaModalSA(true);
  };

  const openEditAreaSA = (area: any) => {
    setEditingAreaSA(area);
    setAreaFormSA({
      name: area.name || '',
      description: (area as any).description || '',
      districtName: (area as any).district_name || (area as any).districtName || '',
      districtLeader: (area as any).district_leader || (area as any).districtLeader || '',
      districtPastor: (area as any).district_pastor || (area as any).districtPastor || '',
      status: (area as any).status || 'active'
    });
    setShowEditAreaModalSA(true);
  };

  const handleSaveAreaSA = async () => {
    if (!editingAreaSA) return;
    if (!areaFormSA.name.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter an area name.', variant: 'destructive' });
      return;
    }
    try {
      await updateArea(editingAreaSA.id, {
        name: areaFormSA.name.trim(),
        description: areaFormSA.description,
        district_name: areaFormSA.districtName,
        district_leader: areaFormSA.districtLeader,
        district_pastor: areaFormSA.districtPastor,
        status: areaFormSA.status,
      } as any);
      toast({ title: 'Area Updated', description: 'Area details saved.' });
      setShowEditAreaModalSA(false);
      setEditingAreaSA(null);
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleDeleteAreaSA = async (areaId: string) => {
    if (!window.confirm('Delete this area? This cannot be undone.')) return;
    try {
      await deleteArea(areaId);
      toast({ title: 'Area Deleted', description: 'Area removed successfully.' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    }
  };
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [newZone, setNewZone] = useState({
  name: "",
  leaderName: "",
  leaderEmail: "",
  leaderPhone: "",
  description: "",
  districtName: "",
  districtLeader: "",
  districtPastor: "",
  status: "active"
});
  
  // User Management state - now using Supabase users
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'cell-leader' as 'super-admin' | 'area-leader' | 'cell-leader' |'zone-leader',
    phone: '',
    password: ''
  });

  // System Settings state
  const [systemConfig, setSystemConfig] = useState({
    churchName: 'Victory Bible Church Intl',
    contactEmail: 'admin@victorybible.org',
    contactPhone: '+233 123 456 7890',
    timezone: 'Africa/Accra',
    dateFormat: 'DD/MM/YYYY',
    currency: 'GHS',
    maxCellSize: 20,
    backupFrequency: 'daily',
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    }
  });

  // Load settings from Supabase on mount (if available)
  useEffect(() => {
    (async () => {
      try {
        const s = await settingsService.getSystemSettings();
        if (s) {
          setSystemConfig({
            churchName: s.church_name || 'Victory Bible Church Intl',
            contactEmail: s.contact_email || 'admin@victorybible.org',
            contactPhone: s.contact_phone || '+233 123 456 7890',
            timezone: s.timezone || 'Africa/Accra',
            dateFormat: s.date_format || 'DD/MM/YYYY',
            currency: s.currency || 'GHS',
            maxCellSize: s.max_cell_size ?? 20,
            backupFrequency: (s.backup_frequency as any) || 'daily',
            notificationSettings: {
              emailNotifications: !!s.email_notifications,
              smsNotifications: !!s.sms_notifications,
              pushNotifications: !!s.push_notifications,
            },
          });
        }
      } catch (e) {
        console.warn('Failed to load system settings', e);
      }
    })();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Super Admin Report Generators
  const generateSystemAttendanceReport = () => {
  const totalZones = zones.length;
  const totalAreas = areas.length;
  const totalCells = cells.length;
  const totalMeetings = meetings.length;
  const totalAttendance = meetings.reduce((s, m) => s + (m.attendance_count || 0), 0);
  const totalVisitors = meetings.reduce((s, m: any) => s + ((m as any).visitors_count || 0), 0);
  const totalConverts = meetings.reduce((s, m: any) => s + ((m as any).converts_count || 0), 0);
  const totalFollowups = meetings.reduce((s, m: any) => s + ((m as any).followups_count || 0), 0);
  const totalVisits = meetings.reduce((s, m: any) => s + ((m as any).visits_count || 0), 0);
  const averageAttendance = totalMeetings > 0 ? Math.round(totalAttendance / totalMeetings) : 0;
    const areaData = areas.map((area) => {
      const aCells = cells.filter(c => c.area_id === area.id);
      const cellIds = aCells.map(c => c.id);
      const aMeetings = meetings.filter(m => cellIds.includes(m.cell_id));
      const membersCount = members.filter(m => cellIds.includes(m.cell_id)).length;
      const att = aMeetings.reduce((s, m) => s + (m.attendance_count || 0), 0);
      return {
        name: area.name,
        cells: aCells.length,
        members: membersCount,
        meetings: aMeetings.length,
        averageAttendance: aMeetings.length > 0 ? Math.round(att / aMeetings.length) : 0,
      };
    });
    setReportData({
    title: 'System Attendance Report',
    period: `Generated on ${new Date().toLocaleDateString()}`,
    summary: { totalZones, totalAreas, totalCells, totalMembers: members.length, totalMeetings, totalAttendance, averageAttendance, totalVisitors, totalConverts, totalFollowups, totalVisits },
    areas: areaData,
  });
  setShowReportModal(true);
};

  const generateSystemOfferingReport = () => {
  const totalZones = zones.length;
  const totalAreas = areas.length;
  const totalCells = cells.length;
  const totalMeetings = meetings.length;
  const totalOfferings = meetings.reduce((s, m) => s + (m.offering_amount || 0), 0);
  const totalVisitors = meetings.reduce((s, m: any) => s + ((m as any).visitors_count || 0), 0);
  const totalConverts = meetings.reduce((s, m: any) => s + ((m as any).converts_count || 0), 0);
  const totalFollowups = meetings.reduce((s, m: any) => s + ((m as any).followups_count || 0), 0);
  const totalVisits = meetings.reduce((s, m: any) => s + ((m as any).visits_count || 0), 0);
    const areaData = areas.map((area) => {
      const aCells = cells.filter(c => c.area_id === area.id);
      const cellIds = aCells.map(c => c.id);
      const aMeetings = meetings.filter(m => cellIds.includes(m.cell_id));
      const offerings = aMeetings.reduce((s, m) => s + (m.offering_amount || 0), 0);
      const att = aMeetings.reduce((s, m) => s + (m.attendance_count || 0), 0);
      return {
        name: area.name,
        cells: aCells.length,
        members: members.filter(m => cellIds.includes(m.cell_id)).length,
        meetings: aMeetings.length,
        attendance: att,
        offerings,
      };
    });
    setReportData({
    title: 'System Offering Report',
    period: `Generated on ${new Date().toLocaleDateString()}`,
    summary: { totalZones, totalAreas, totalCells, totalMembers: members.length, totalMeetings, totalOfferings, totalVisitors, totalConverts, totalFollowups, totalVisits },
    areas: areaData,
  });
  setShowReportModal(true);
};

  const generateAreaPerformanceReportSA = () => {
    const totalZones = zones.length;
    const areaData = areaStats.map((a: any) => ({
      name: a.name,
      cells: a.totalCells,
      members: a.totalMembers,
      meetings: Math.round(a.totalAttendance / (a.averageAttendance || 1)) || 0,
      attendance: a.totalAttendance,
      offerings: a.totalOfferings,
    }));
    setReportData({
      title: 'Area Performance Report',
      period: `Generated on ${new Date().toLocaleDateString()}`,
      summary: { totalZones, totalAreas: areas.length, totalCells: cells.length, totalMembers: members.length, totalMeetings: meetings.length, totalAttendance: meetings.reduce((s,m)=>s+(m.attendance_count||0),0), totalOfferings: meetings.reduce((s,m)=>s+(m.offering_amount||0),0), averageAttendance: meetings.length>0?Math.round(meetings.reduce((s,m)=>s+(m.attendance_count||0),0)/meetings.length):0 },
      areas: areaData,
    });
    setShowReportModal(true);
  };

  const generateZonePerformanceReportSA = () => {
    const zonesData = zoneStats.map((z: any) => ({
      name: z.name,
      areas: z.totalAreas,
      cells: z.totalCells,
      members: z.totalMembers,
      meetings: Math.round(z.totalAttendance / (z.averageAttendance || 1)) || 0,
      averageAttendance: z.averageAttendance,
      totalOfferings: z.totalOfferings,
    }));
    setReportData({
      title: 'Zone Performance Report',
      period: `Generated on ${new Date().toLocaleDateString()}`,
      summary: { totalZones: zones.length, totalAreas: areas.length, totalCells: cells.length, totalMembers: members.length, totalMeetings: meetings.length, totalAttendance: meetings.reduce((s,m)=>s+(m.attendance_count||0),0), totalOfferings: meetings.reduce((s,m)=>s+(m.offering_amount||0),0), averageAttendance: meetings.length>0?Math.round(meetings.reduce((s,m)=>s+(m.attendance_count||0),0)/meetings.length):0 },
      zones: zonesData,
    });
    setShowReportModal(true);
  };

  // Calculate system statistics from real data
  const systemStats = {
    totalAreas: areas.length,
    totalCells: cells.length,
    // Members are a separate collection; count them directly
    totalMembers: members.length,
    totalLeaders: areas.length + cells.length, // area leaders + cell leaders
    thisWeekAttendance: meetings.reduce((sum, meeting) => sum + (meeting.attendance_count || 0), 0),
    thisWeekOffering: meetings.reduce((sum, meeting) => sum + (meeting.offering_amount || 0), 0),
    activeUsers: areas.length + cells.length // simplified for demo
  };

  // Calculate area statistics (derived from base tables)
  const areaStats = areas.map((area) => {
    const areaCells = cells.filter((cell) => cell.area_id === area.id);
    const areaCellIds = areaCells.map((c) => c.id);
    const areaMeetings = meetings.filter((m) => areaCellIds.includes(m.cell_id));
    const totalMembers = members.filter((m) => areaCellIds.includes(m.cell_id)).length;
    const totalAttendance = areaMeetings.reduce((sum, m) => sum + (m.attendance_count || 0), 0);
    const totalOfferings = areaMeetings.reduce((sum, m) => sum + (m.offering_amount || 0), 0);
    const averageAttendance = areaMeetings.length > 0 ? Math.round(totalAttendance / areaMeetings.length) : 0;

    const leaderName = users.find((u) => u.id === area.leader_id)?.name || 'Not assigned';

    return {
      ...area,
      totalCells: areaCells.length,
      totalMembers,
      totalAttendance,
      totalOfferings,
      averageAttendance,
      leaderName,
    } as any;
  });
  // Recent activity based on real data
  const recentActivity = [
    ...meetings.slice(0, 3).map((meeting) => {
      const cell = cells.find((c) => c.id === meeting.cell_id);
      const area = cell ? areas.find((a) => a.id === cell.area_id) : undefined;
      const createdAt = new Date(meeting.created_at);
      return {
        type: 'meeting' as const,
        area: area?.name || 'Unknown',
        cell: cell?.name || 'Unknown',
        action: `Meeting recorded with ${meeting.attendance_count || 0} attendees`,
        time: `${Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60))} hours ago`,
      };
    }),
    ...alerts.slice(0, 2).map((alert) => ({
      type: 'system' as const,
      area: 'System',
      cell: '',
      action: `Alert created: ${alert.title}`,
      time: `${Math.floor((Date.now() - new Date(alert.created_at).getTime()) / (1000 * 60 * 60))} hours ago`,
    })),
  ];

  const handleViewAreaDetails = (area: any) => {
    setSelectedArea(area);
    setShowAreaDetails(true);
  };

  const handleCreateAlert = async () => {
    if (!newAlert.title || !newAlert.message) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const basePayload: any = {
      title: newAlert.title,
      message: newAlert.message,
      type: newAlert.type,
      target_audience: newAlert.target_audience,
      priority: newAlert.priority,
      is_active: true,
      created_by: user?.id || ''
    };

    try {
      if (sendToSpecificUsers && selectedRecipientIds.length > 0) {
        await addAlert({ ...basePayload, recipient_user_ids: selectedRecipientIds } as any);
      } else {
        await addAlert(basePayload as any);
      }
      toast({
        title: "Alert Created",
        description: sendToSpecificUsers && selectedRecipientIds.length > 0
          ? "Alert created for selected users."
          : "New alert has been created and sent to the selected audience.",
      });
      setNewAlert({ title: "", message: "", type: "info", target_audience: "all", priority: "normal" });
      setSendToSpecificUsers(false);
      setSelectedRecipientIds([]);
      setRecipientSearch("");
      setShowAlertForm(false);
    } catch (e: any) {
      // Graceful fallback if the DB schema doesn't support recipient_user_ids
      if (sendToSpecificUsers && selectedRecipientIds.length > 0) {
        try {
          await addAlert(basePayload as any);
          toast({
            title: "Alert Created (no per-user targeting)",
            description: "Per-user recipients are not enabled in the database yet. Created as a role/all alert.",
          });
          setNewAlert({ title: "", message: "", type: "info", target_audience: "all", priority: "normal" });
          setSendToSpecificUsers(false);
          setSelectedRecipientIds([]);
          setRecipientSearch("");
          setShowAlertForm(false);
        } catch (err: any) {
          toast({ title: 'Failed to create alert', description: err?.message || 'Please try again.', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Failed to create alert', description: e?.message || 'Please try again.', variant: 'destructive' });
      }
    }
  };

  const handleToggleAlert = (alertId: string, isActive: boolean) => {
    updateAlert(alertId, { is_active: isActive });
    toast({
      title: isActive ? "Alert Activated" : "Alert Deactivated",
      description: `Alert has been ${isActive ? 'activated' : 'deactivated'}.`,
    });
  };

  const handleDeleteAlert = (alertId: string) => {
    deleteAlert(alertId);
    toast({
      title: "Alert Deleted",
      description: "Alert has been permanently deleted.",
    });
  };

  const handleGenerateReport = (type: 'monthly' | 'quarterly' | 'annual') => {
    setSelectedReportType(type);
    setShowReportModal(true);
    
    // Generate report data based on type
    const report = generateReportData(type);
    setReportData(report);
    
    toast({
      title: "Report Generated",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} report has been generated successfully.`,
    });
  };

  const generateReportData = (type: 'monthly' | 'quarterly' | 'annual') => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (type) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'annual':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }
    
    const periodMeetings = meetings.filter((m) => {
      const d = new Date(m.date);
      return d >= startDate && d <= endDate;
    });

    const totalAttendance = periodMeetings.reduce((sum, m) => sum + (m.attendance_count || 0), 0);
    const totalOfferings = periodMeetings.reduce((sum, m) => sum + (m.offering_amount || 0), 0);
    const totalVisitors = periodMeetings.reduce((sum, m: any) => sum + ((m as any).visitors_count || 0), 0);
    const totalConverts = periodMeetings.reduce((sum, m: any) => sum + ((m as any).converts_count || 0), 0);
    const totalFollowups = periodMeetings.reduce((sum, m: any) => sum + ((m as any).followups_count || 0), 0);
    const totalVisits = periodMeetings.reduce((sum, m: any) => sum + ((m as any).visits_count || 0), 0);
    
    return {
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      summary: {
        totalMeetings: periodMeetings.length,
        totalAttendance,
        totalOfferings,
        totalVisitors,
        totalConverts,
        totalFollowups,
        totalVisits,
        averageAttendance: periodMeetings.length > 0 ? Math.round(totalAttendance / periodMeetings.length) : 0,
        totalZones: zones.length,
        totalAreas: areas.length,
        totalCells: cells.length,
        totalMembers: members.length,
      },
      data: {
        areas: areaStats.map((area: any) => ({
          name: area.name,
          cells: area.totalCells,
          members: area.totalMembers,
          attendance: area.totalAttendance,
          offerings: area.totalOfferings
        }))
      }
    };
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const csvContent = generateCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Report has been exported to CSV successfully.",
    });
  };

  const generateCSV = (data: any) => {
    const rows: string[][] = [];
    if (data.summary) {
      const s = data.summary;
      rows.push(['Total Zones', String(s.totalZones ?? 0)]);
      rows.push(['Total Areas', String(s.totalAreas ?? 0)]);
      rows.push(['Total Cells', String(s.totalCells ?? 0)]);
      rows.push(['Total Members', String(s.totalMembers ?? 0)]);
      rows.push(['Total Meetings', String(s.totalMeetings ?? 0)]);
      rows.push(['Total Attendance', String(s.totalAttendance ?? 0)]);
      rows.push(['Average Attendance', `${s.averageAttendance ?? 0}%`]);
      rows.push(['Total Offerings', `₵${(s.totalOfferings ?? 0).toLocaleString()}`]);
      rows.push(['Total Visitors', String(s.totalVisitors ?? 0)]);
      rows.push(['Total Converts', String(s.totalConverts ?? 0)]);
      rows.push(['Total Follow-ups', String(s.totalFollowups ?? 0)]);
      rows.push(['Total Visits', String(s.totalVisits ?? 0)]);
    } else if (data.data) {
      // Back-compat
      rows.push(['Total Meetings', String(data.data.totalMeetings)]);
      rows.push(['Total Attendance', String(data.data.totalAttendance)]);
      rows.push(['Total Offerings', `₵${data.data.totalOfferings.toLocaleString()}`]);
      rows.push(['Total Visitors', String(data.data.totalVisitors)]);
      rows.push(['Total Converts', String(data.data.totalConverts ?? 0)]);
      rows.push(['Total Follow-ups', String(data.data.totalFollowups ?? 0)]);
      rows.push(['Total Visits', String(data.data.totalVisits ?? 0)]);
      rows.push(['Average Attendance', `${data.data.averageAttendance}%`]);
    }
    rows.push([]);
    if (data.areas) {
      rows.push(['Area Name', 'Cells', 'Members', 'Meetings', 'Attendance', 'Offerings']);
      data.areas.forEach((a: any) => {
        rows.push([
          a.name,
          String(a.cells ?? 0),
          String(a.members ?? 0),
          String(a.meetings ?? 0),
          String(a.attendance ?? a.averageAttendance ?? 0),
          `₵${(a.offerings ?? a.totalOfferings ?? 0).toLocaleString()}`,
        ]);
      });
    }
    if (data.zones) {
      rows.push([]);
      rows.push(['Zone Name', 'Areas', 'Cells', 'Members', 'Meetings', 'Avg Attendance', 'Total Offerings']);
      data.zones.forEach((z: any) => {
        rows.push([
          z.name,
          String(z.areas ?? z.totalAreas ?? 0),
          String(z.cells ?? z.totalCells ?? 0),
          String(z.members ?? z.totalMembers ?? 0),
          String(z.meetings ?? 0),
          String(z.averageAttendance ?? 0),
          `₵${(z.totalOfferings ?? 0).toLocaleString()}`,
        ]);
      });
    }
    return rows.map(r => r.join(',')).join('\n');
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedReportType(null);
    setReportData(null);
  };

  // User Management functions
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Minimal user shape aligned with supabase User
    const userData = {
      name: newUser.name,
      role: newUser.role,
      phone: newUser.phone,
      is_active: true,
      // backend sets timestamps
    } as any;

    await addUser(userData);
    
    // Reset form
    setNewUser({
      name: '',
      email: '',
      role: 'cell-leader',
      phone: '',
      password: ''
    });
    
    setShowAddUserModal(false);
    
    toast({
      title: "User Added",
      description: "New user has been created successfully.",
    });
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: '',
      role: user.role,
      phone: user.phone || '',
      password: ''
    });
    setShowAddUserModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !newUser.name || !newUser.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    await updateUser(editingUser.id, { name: newUser.name, role: newUser.role, phone: newUser.phone });
    
    // Reset form
    setNewUser({
      name: '',
      email: '',
      role: 'cell-leader',
      phone: '',
      password: ''
    });
    
    setEditingUser(null);
    setShowAddUserModal(false);
    
    toast({
      title: "User Updated",
      description: "User information has been updated successfully.",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: "Error",
        description: "You cannot delete your own account.",
        variant: "destructive",
      });
      return;
    }

    await deleteUser(userId);
    
    toast({
      title: "User Deleted",
      description: "User has been removed from the system.",
    });
  };

  const handleToggleUserStatus = async (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: "Error",
        description: "You cannot deactivate your own account.",
        variant: "destructive",
      });
      return;
    }

    const target = users.find((u) => u.id === userId);
    if (target) {
      await updateUser(userId, { is_active: !target.is_active } as any);
    }
    
    toast({
      title: "User Status Updated",
      description: "User status has been changed successfully.",
    });
  };

  // System Settings functions
  const handleSaveSystemSettings = async () => {
    try {
      await settingsService.saveSystemSettings({
        church_name: systemConfig.churchName,
        contact_email: systemConfig.contactEmail,
        contact_phone: systemConfig.contactPhone,
        timezone: systemConfig.timezone,
        date_format: systemConfig.dateFormat,
        currency: systemConfig.currency,
        max_cell_size: systemConfig.maxCellSize,
        backup_frequency: systemConfig.backupFrequency as any,
        email_notifications: systemConfig.notificationSettings.emailNotifications,
        sms_notifications: systemConfig.notificationSettings.smsNotifications,
        push_notifications: systemConfig.notificationSettings.pushNotifications,
      } as any);
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });
      setShowSystemSettings(false);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Could not save settings.', variant: 'destructive' });
    }
  };

  const handleResetSystemSettings = async () => {
    const defaults = {
      churchName: 'Victory Bible Church Intl',
      contactEmail: 'admin@victorybible.org',
      contactPhone: '+233 123 456 7890',
      timezone: 'Africa/Accra',
      dateFormat: 'DD/MM/YYYY',
      currency: 'GHS',
      maxCellSize: 20,
      backupFrequency: 'daily',
      notificationSettings: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
      },
    };
    setSystemConfig(defaults);
    try {
      await settingsService.saveSystemSettings({
        church_name: defaults.churchName,
        contact_email: defaults.contactEmail,
        contact_phone: defaults.contactPhone,
        timezone: defaults.timezone,
        date_format: defaults.dateFormat,
        currency: defaults.currency,
        max_cell_size: defaults.maxCellSize,
        backup_frequency: defaults.backupFrequency as any,
        email_notifications: defaults.notificationSettings.emailNotifications,
        sms_notifications: defaults.notificationSettings.smsNotifications,
        push_notifications: defaults.notificationSettings.pushNotifications,
      } as any);
    } catch {}
    toast({
      title: "Settings Reset",
      description: "System settings have been reset to defaults.",
    });
  };

  // Quick Actions functions
  const handleAddNewArea = () => {
    setShowAddAreaModal(true);
  };

  const handleManageUsers = () => {
    setShowUserManagement(true);
  };

  const handleSystemSettings = () => {
    setShowSystemSettings(true);
  };

   //Zone Creation state 
   const handleAddNewZone = async () => {
    if (!newZone.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a zone name",
        variant: "destructive",
      });
      return;
    }
    try {
      const zonePayload = {
        name: newZone.name.trim(),
        description: newZone.description || null,
        district_name: newZone.districtName || null,
        district_leader: newZone.districtLeader || null,
        district_pastor: newZone.districtPastor || null,
        status: (newZone.status as 'active' | 'inactive') || 'active',
      } as any;

      const createdZone = await addZone(zonePayload);

      toast({
        title: "Success",
        description: "Zone created successfully",
      });

      // If leader details were provided, immediately provision and assign a zone leader
      if (newZone.leaderName.trim() && newZone.leaderEmail.trim()) {
        try {
          const pwd = genPassword(newZone.leaderName);
          const res: any = await authService.provisionUser({
            email: newZone.leaderEmail.trim(),
            password: pwd,
            name: newZone.leaderName.trim(),
            phone: newZone.leaderPhone || undefined,
            role: 'zone-leader' as any,
            zone_id: createdZone.id,
          });
          const leaderId = res?.user?.id || res?.userId;
          const shownPwd = (res?.password as string) || pwd;
          if (leaderId) {
            try {
              await updateZone(createdZone.id, { leader_id: leaderId } as any);
            } catch {}
            try {
              await updateUser(leaderId, { zone_id: createdZone.id } as any);
            } catch {
              // If profile row doesn't exist yet, create it as super-admin
              try {
                await addUserWithId(leaderId, {
                  name: newZone.leaderName.trim(),
                  phone: newZone.leaderPhone || undefined,
                  role: 'zone-leader' as any,
                  zone_id: createdZone.id,
                  is_active: true as any,
                } as any);
              } catch {}
            }
            try { await refreshData(); } catch {}
            // Show credentials dialog
            setAssignedCreds({ email: newZone.leaderEmail.trim(), password: shownPwd });
            setShowCredsDialog(true);
          }
        } catch (provErr: any) {
          toast({ title: 'Leader provisioning failed', description: provErr?.message || 'Could not create zone leader.', variant: 'destructive' });
        }
      }

      setShowAddZoneModal(false);
      setNewZone({
        name: "",
        leaderName: "",
        leaderEmail: "",
        leaderPhone: "",
        description: "",
        districtName: "",
        districtLeader: "",
        districtPastor: "",
        status: "active"
      });
    } catch (e: any) {
      toast({
        title: "Failed to create zone",
        description: e?.message || 'Please try again.',
        variant: 'destructive'
      });
    }
  };
  // Area creation state
  const [newArea, setNewArea] = useState({
    name: '',
    description: '',
    leaderName: '',
    leaderEmail: '',
    leaderPhone: '',
    districtName: '',
    areaLeaderName: '',
    districtLeaderName: '',
    districtPastorName: '',
    zoneId: ''
  });

  function setArea(arg0: { districtName: string; name: string; description: string; leaderName: string; leaderEmail: string; leaderPhone: string; areaLeaderName: string; districtLeaderName: string; districtPastorName: string; }): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Alert Notifications */}
        <AlertNotifications userRole="super-admin" />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Complete system overview and management</p>
          </div>
          <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowUserManagement(true)}>
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          {/* Settings button removed (redundant) */}
          <Button variant="outline" onClick={handleLogout} size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Area</CardTitle>
              <Church className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalAreas}</div>
              <p className="text-xs text-muted-foreground">Active area</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Cells</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalCells}</div>
              <p className="text-xs text-muted-foreground">Home cells</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">Active members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.thisWeekAttendance}</div>
              <p className="text-xs text-muted-foreground">Total attendance</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
            <TabsTrigger value="areas">Areas</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
          
  
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Area Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Area Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {areaStats.map(area => (
                    <div key={area.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{area.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {area.totalCells} cells, {area.totalMembers} members
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{area.averageAttendance}%</p>
                        <p className="text-sm text-muted-foreground">attendance</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Zone Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Zone Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {zoneStats.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{zone.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {zone.totalAreas} areas, {zone.totalCells} cells
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₵{zone.totalOfferings.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">offerings</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                      <div className="bg-primary/10 p-2 rounded-full">
                        {activity.type === "meeting" && <Calendar className="h-4 w-4 text-primary" />}
                        {activity.type === "system" && <Bell className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.area} • {activity.cell} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            </TabsContent>

          {/* Meetings Tab: system-wide recent meetings */}
          <TabsContent value="meetings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Meetings</CardTitle>
                <CardDescription>Latest meetings recorded across all cells</CardDescription>
              </CardHeader>
              <CardContent>
                {meetings.length > 0 ? (
                  <div className="space-y-3">
                    {meetings
                      .slice(0, 20)
                      .map((meeting) => {
                        const cell = cells.find((c) => c.id === meeting.cell_id);
                        const area = cell ? areas.find((a) => a.id === cell.area_id) : undefined;
                        return (
                          <div key={meeting.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{new Date(meeting.date).toLocaleDateString()}</p>
                              <p className="text-sm text-muted-foreground">
                                {area?.name || 'Unknown Area'} • {cell?.name || 'Unknown Cell'} • {(meeting.attendance_count || 0)} attendees
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
                    <p className="text-sm text-muted-foreground">Meeting records will appear here once they are created</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
           
            <TabsContent value="zones" className="space-y-6">
          
          <Card>
    <CardHeader>
        <div className="div flex items-center justify-between">
          <div>
            <CardTitle>Zone Management</CardTitle>
            <CardDescription>Create and manage church zones</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={zoneUnassignedOnly ? 'default' : 'outline'} size="sm" onClick={() => setZoneUnassignedOnly(v => !v)}>
              {zoneUnassignedOnly ? 'Showing Unassigned' : 'Unassigned Only'}
            </Button>
            <Button onClick={() => setShowAddZoneModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Zone
            </Button>
          </div>
        </div>
    </CardHeader>
    <CardContent>
      {zones.length > 0 ? (
        <div className="space-y-3">
          {zones
            .filter((z: any) => (zoneUnassignedOnly ? !(z.leader_id) : true))
            .map((zone) => (
            <div key={zone.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">{zone.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const leaderName = users.find(u => u.id === (zone as any).leader_id)?.name || 'Not assigned';
                    const zAreas = areas.filter(a => a.zone_id === zone.id);
                    const areaIds = zAreas.map(a => a.id);
                    const zCells = cells.filter(c => areaIds.includes(c.area_id));
                    return `Leader: ${leaderName} • ${zAreas.length} areas • ${zCells.length} cells`;
                  })()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                  {zone.status}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => openAssignZoneLeader(zone)}>
                  {(zone as any).leader_id ? 'Change Leader' : 'Assign Leader'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEditZone(zone)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteZone(zone.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Church className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No zones created yet</p>
          <p className="text-sm text-muted-foreground">Start by adding your first zone</p>
        </div>
      )}

      {/* Assign Zone Leader Dialog */}
      <Dialog open={showAssignZoneLeaderDialog} onOpenChange={setShowAssignZoneLeaderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assignForZone?.leader_id ? 'Change Zone Leader' : 'Assign Zone Leader'}</DialogTitle>
            <DialogDescription>
              {assignForZone ? `Assign a leader to zone: ${assignForZone.name}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button variant={assignZoneMode === 'existing' ? 'default' : 'outline'} size="sm" onClick={() => setAssignZoneMode('existing')}>Select Existing</Button>
              <Button variant={assignZoneMode === 'new' ? 'default' : 'outline'} size="sm" onClick={() => setAssignZoneMode('new')}>Create New</Button>
            </div>
            {assignZoneMode === 'existing' ? (
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={selectedZoneLeaderId} onValueChange={setSelectedZoneLeaderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a zone leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u: any) => (u as any).role === 'zone-leader')
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
                  <Input value={newZoneLeaderName} onChange={(e) => setNewZoneLeaderName(e.target.value)} placeholder="Full name" required />
                  {assignZoneMode === 'new' && !newZoneLeaderName.trim() && (
                    <p className="mt-1 text-xs text-red-500">Leader name is required</p>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={newZoneLeaderEmail} onChange={(e) => setNewZoneLeaderEmail(e.target.value)} placeholder="email@example.com" required />
                  {assignZoneMode === 'new' && !newZoneLeaderEmail.trim() && (
                    <p className="mt-1 text-xs text-red-500">Email is required</p>
                  )}
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={newZoneLeaderPhone} onChange={(e) => setNewZoneLeaderPhone(e.target.value)} placeholder="Phone (optional)" />
                </div>
              </div>
            )}

            {assignedCreds && (
              <div className="mt-2 p-3 border rounded-md bg-muted/30">
                <p className="text-sm font-medium mb-1">Login Credentials</p>
                <p className="text-xs">Email: <span className="font-mono">{assignedCreds.email}</span></p>
                <p className="text-xs">Password: <span className="font-mono">{assignedCreds.password}</span></p>
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`Email: ${assignedCreds.email}\nPassword: ${assignedCreds.password}`);
                      toast({ title: 'Copied', description: 'Credentials copied to clipboard.' });
                    } catch {}
                  }}>Copy</Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAssignZoneLeaderDialog(false); setAssignedCreds(null); }} disabled={assigningZoneLeader}>Close</Button>
            <Button disabled={assigningZoneLeader || (assignZoneMode === 'existing' ? !selectedZoneLeaderId : (!newZoneLeaderName.trim() || !newZoneLeaderEmail.trim()))} onClick={async () => {
              if (!assignForZone) return;
              try {
                setAssigningZoneLeader(true);
                toast({ title: 'Assigning...', description: assignZoneMode === 'existing' ? 'Assigning selected user as leader' : 'Creating user and assigning as leader' });
                if (assignZoneMode === 'existing') {
                  if (!selectedZoneLeaderId) {
                    toast({ title: 'Select a User', description: 'Please select a user to assign as zone leader.', variant: 'destructive' });
                    setAssigningZoneLeader(false);
                    return;
                  }
                  const prevLeaderId = (assignForZone as any)?.leader_id;
                  if (prevLeaderId && prevLeaderId !== selectedZoneLeaderId) {
                    await updateUser(prevLeaderId, { zone_id: null } as any);
                  }
                  await updateZone(assignForZone.id, { leader_id: selectedZoneLeaderId } as any);
                  await updateUser(selectedZoneLeaderId, { zone_id: assignForZone.id } as any);
                  toast({ title: 'Leader Assigned', description: 'Zone leader has been assigned successfully.' });
                } else {
                  if (!newZoneLeaderName.trim() || !newZoneLeaderEmail.trim()) {
                    toast({ title: 'Validation Error', description: 'Please enter leader name and email.', variant: 'destructive' });
                    setAssigningZoneLeader(false);
                    return;
                  }
                  const pwd = genPassword(newZoneLeaderName);
                  // Provision user via Edge Function (prod) with dev fallback
                  const res: any = await authService.provisionUser({
                    email: newZoneLeaderEmail.trim(),
                    password: pwd,
                    name: newZoneLeaderName.trim(),
                    phone: newZoneLeaderPhone || undefined,
                    role: 'zone-leader' as any,
                    zone_id: assignForZone.id,
                  });
                  const authUser: any = res?.user ?? null;

                  const leaderId = authUser?.id || res?.userId;
                  if (leaderId) {
                    const prevLeaderId = (assignForZone as any)?.leader_id;
                    if (prevLeaderId && prevLeaderId !== leaderId) {
                      await updateUser(prevLeaderId, { zone_id: null } as any);
                    }
                    await updateZone(assignForZone.id, { leader_id: leaderId } as any);
                    await updateUser(leaderId, { zone_id: assignForZone.id } as any);
                  }
                  await refreshData();
                  const shownPwd = (res?.password as string) || pwd;
                  try {
                    await navigator.clipboard.writeText(`Email: ${newZoneLeaderEmail}\nPassword: ${shownPwd}`);
                    toast({ title: 'Leader Created & Assigned', description: `Credentials copied. Email: ${newZoneLeaderEmail} | Password: ${shownPwd}` });
                  } catch {
                    toast({ title: 'Leader Created & Assigned', description: `Credentials — Email: ${newZoneLeaderEmail} | Password: ${shownPwd}` });
                  }
                  setAssignedCreds({ email: newZoneLeaderEmail, password: shownPwd });
                  // Close the assign dialog before opening credentials dialog to prevent stacking issues
                  setShowAssignZoneLeaderDialog(false);
                  setShowCredsDialog(true);
                }
              } catch (e: any) {
                toast({ title: 'Assign failed', description: e?.message || 'Could not assign leader. Please try again.', variant: 'destructive' });
              } finally {
                setAssigningZoneLeader(false);
                // keep dialog open to show credentials when successful; still reset inputs
                setAssignForZone(assignForZone);
                setSelectedZoneLeaderId('');
                setNewZoneLeaderName('');
                setNewZoneLeaderPhone('');
                setNewZoneLeaderEmail('');
              }
            }}>Assign Leader</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={showCredsDialog} onOpenChange={setShowCredsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Login Credentials</DialogTitle>
            <DialogDescription>Share these with the new leader.</DialogDescription>
          </DialogHeader>
          {assignedCreds && (
            <div className="space-y-2">
              <div className="p-3 rounded-md border bg-muted/30">
                <p className="text-sm">Email</p>
                <p className="font-mono text-sm">{assignedCreds.email}</p>
              </div>
              <div className="p-3 rounded-md border bg-muted/30">
                <p className="text-sm">Password</p>
                <p className="font-mono text-sm">{assignedCreds.password}</p>
              </div>
              <div>
                <Button variant="outline" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`Email: ${assignedCreds.email}\nPassword: ${assignedCreds.password}`);
                    toast({ title: 'Copied', description: 'Credentials copied to clipboard.' });
                  } catch {}
                }}>Copy to Clipboard</Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setShowCredsDialog(false); setAssignedCreds(null); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
  </TabsContent>
             
        <TabsContent value="areas" className="space-y-6">
        <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Area Management</CardTitle>
                  <CardDescription>Create and manage church areas</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={areaUnassignedOnly ? 'default' : 'outline'} size="sm" onClick={() => setAreaUnassignedOnly(v => !v)}>
                    {areaUnassignedOnly ? 'Showing Unassigned' : 'Unassigned Only'}
                  </Button>
                  <Button onClick={() => setShowAddAreaModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Area
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {areas.length > 0 ? (
                <div className="space-y-3">
                  {areas
                    .filter((a: any) => (areaUnassignedOnly ? !(a.leader_id) : true))
                    .map((area) => (
                    <div key={area.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">{area.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(() => {
                            const leaderName = users.find(u => u.id === (area as any).leader_id)?.name || 'Not assigned';
                            const aCells = cells.filter(c => c.area_id === area.id);
                            const cellIds = aCells.map(c => c.id);
                            const memberCount = members.filter(m => cellIds.includes(m.cell_id)).length;
                            return `Leader: ${leaderName} • ${aCells.length} cells • ${memberCount} members`;
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={area.status === 'active' ? 'default' : 'secondary'}>
                          {area.status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => openViewAreaSA(area)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditAreaSA(area)}>
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteAreaSA(area.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Church className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No areas created yet</p>
                  <p className="text-sm text-muted-foreground">Start by adding your first area</p>
                </div>
              )}
            </CardContent>
          </Card>  
          {/* View Area Dialog (Super Admin) */}
          <Dialog open={showViewAreaModalSA} onOpenChange={setShowViewAreaModalSA}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Area Details</DialogTitle>
                <DialogDescription>Overview for {selectedArea?.name || ''}</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedArea?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">{selectedArea?.status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">District Name</p>
                    <p className="font-medium">{(selectedArea as any)?.district_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">District Leader</p>
                    <p className="font-medium">{(selectedArea as any)?.district_leader || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">District Pastor</p>
                    <p className="font-medium">{(selectedArea as any)?.district_pastor || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="font-medium whitespace-pre-wrap">{(selectedArea as any)?.description || '—'}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowViewAreaModalSA(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Area Dialog (Super Admin) */}
          <Dialog open={showEditAreaModalSA} onOpenChange={setShowEditAreaModalSA}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Area</DialogTitle>
                <DialogDescription>Update the details of this area</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Area Name</Label>
                  <Input value={areaFormSA.name} onChange={(e) => setAreaFormSA({ ...areaFormSA, name: e.target.value })} />
                </div>
                <div>
                  <Label>District Name</Label>
                  <Input value={areaFormSA.districtName} onChange={(e) => setAreaFormSA({ ...areaFormSA, districtName: e.target.value })} />
                </div>
                <div>
                  <Label>District Leader</Label>
                  <Input value={areaFormSA.districtLeader} onChange={(e) => setAreaFormSA({ ...areaFormSA, districtLeader: e.target.value })} />
                </div>
                <div>
                  <Label>District Pastor</Label>
                  <Input value={areaFormSA.districtPastor} onChange={(e) => setAreaFormSA({ ...areaFormSA, districtPastor: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={areaFormSA.description} onChange={(e) => setAreaFormSA({ ...areaFormSA, description: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={areaFormSA.status} onValueChange={(v) => setAreaFormSA({ ...areaFormSA, status: v as 'active' | 'inactive' })}>
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
                <Button variant="outline" onClick={() => setShowEditAreaModalSA(false)}>Cancel</Button>
                <Button onClick={handleSaveAreaSA}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {areaStats.map((area) => (
                <Card key={area.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{area.name}</CardTitle>
                      <Badge variant="secondary">{area.totalCells} cells</Badge>
                    </div>
                    <CardDescription>{(area as any).leaderName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">Area Leader:</span> {(area as any).leaderName || (area as any).areaLeaderName || '—'}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">District Leader:</span> {(area as any).district_leader || (area as any).districtLeader || (area as any).districtLeaderName || '—'}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">District Pastor:</span> {(area as any).district_pastor || (area as any).districtPastor || (area as any).districtPastorName || '—'}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">District Name:</span> {(area as any).district_name || (area as any).districtName || '—'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Members</p>
                        <p className="font-semibold">{area.totalMembers}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Attendance</p>
                        <p className="font-semibold">{area.averageAttendance}%</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Total Offerings: ₵{area.totalOfferings.toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleViewAreaDetails(area)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">System Alerts</h3>
              <Button onClick={() => setShowAlertForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </div>

            {/* Alert Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Distribution Summary</CardTitle>
                <CardDescription>Overview of how alerts are distributed across user roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{alerts.filter(a => a.is_active).length}</p>
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{alerts.filter(a => a.target_audience === 'all' && a.is_active).length}</p>
                    <p className="text-sm text-muted-foreground">All Users</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{alerts.filter(a => a.target_audience === 'area-leaders' && a.is_active).length}</p>
                    <p className="text-sm text-muted-foreground">Area Leaders</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{alerts.filter(a => a.target_audience === 'cell-leaders' && a.is_active).length}</p>
                    <p className="text-sm text-muted-foreground">Cell Leaders</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={alert.type === "error" ? "destructive" : "secondary"}>
                          {alert.type}
                        </Badge>
                        <Badge variant={alert.priority === "high" ? "destructive" : "secondary"}>
                          {alert.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAlert(alert.id, !alert.is_active)}
                        >
                          {alert.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-2">{alert.title}</h4>
                    <p className="text-muted-foreground mb-3">{alert.message}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-2">
                          <span>Target:</span>
                          <Badge variant="outline">
                            {alert.target_audience === 'all' ? 'All Users' : 
                             alert.target_audience === 'area-leaders' ? 'Area Leaders' : 'Cell Leaders'}
                          </Badge>
                        </span>
                        <span className="flex items-center space-x-2">
                          <span>Priority:</span>
                          <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                            {alert.priority}
                          </Badge>
                        </span>
                      </div>
                      <span>{new Date(alert.created_at).toLocaleDateString()} at {new Date(alert.created_at).toLocaleTimeString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="outline" onClick={generateSystemAttendanceReport}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    System Attendance Report
                  </Button>
                  <Button className="w-full" variant="outline" onClick={generateSystemOfferingReport}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    System Offering Report
                  </Button>
                  <Button className="w-full" variant="outline" onClick={generateAreaPerformanceReportSA}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Area Performance Report
                  </Button>
                  <Button className="w-full" variant="outline" onClick={generateZonePerformanceReportSA}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Zone Performance Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleManageUsers}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleSystemSettings}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Zones</span>
                    <Badge variant="secondary">{zones.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Areas</span>
                    <Badge variant="secondary">{areas.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Cells</span>
                    <Badge variant="secondary">{cells.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Alerts</span>
                    <Badge variant="secondary">{alerts.filter(a => a.is_active).length}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Alert Modal */}
      {showAlertForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Alert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                  placeholder="Alert title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                  placeholder="Alert message"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newAlert.type}
                    onValueChange={(value) => setNewAlert({ ...newAlert, type: value as 'info' | 'warning' | 'success' | 'error' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newAlert.priority}
                    onValueChange={(value) => setNewAlert({ ...newAlert, priority: value as 'low' | 'normal' | 'high' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select
                  value={newAlert.target_audience}
                  onValueChange={(value) => setNewAlert({ ...newAlert, target_audience: value as 'all' | 'area-leaders' | 'cell-leaders' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="zone-leaders">Zone Leaders</SelectItem>
                  <SelectItem value="area-leaders">Area Leaders</SelectItem>
                  <SelectItem value="cell-leaders">Cell Leaders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optional: Per-user recipients */}
              <div className="space-y-2">
                <Label>Recipients</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="send-specific-users"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={sendToSpecificUsers}
                    onChange={(e) => setSendToSpecificUsers(e.target.checked)}
                  />
                  <Label htmlFor="send-specific-users">Send to specific users only</Label>
                </div>
                {sendToSpecificUsers && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Search users by name"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                    />
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                      {users
                        .filter((u) => (u as any).is_active !== false)
                        .filter((u) => (u.name || '').toLowerCase().includes(recipientSearch.toLowerCase()))
                        .map((u) => {
                          const checked = selectedRecipientIds.includes(u.id);
                          return (
                            <label key={u.id} className="flex items-center space-x-2 py-1">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedRecipientIds((prev) => (
                                    e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id)
                                  ));
                                }}
                              />
                              <span>
                                {u.name} <span className="text-xs text-muted-foreground">({u.role})</span>
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleCreateAlert} className="flex-1">
                  Create Alert
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAlertForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sync from Auth Modal */}
      {showSyncFromAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Sync User from Auth</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSyncFromAuth(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Auth User ID (UUID)</Label>
                <Input value={syncAuthId} onChange={(e) => setSyncAuthId(e.target.value)} placeholder="Paste Supabase Auth user id" />
              </div>
              <div>
                <Label>Full Name</Label>
                <Input value={syncName} onChange={(e) => setSyncName(e.target.value)} placeholder="User's full name" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={syncPhone} onChange={(e) => setSyncPhone(e.target.value)} placeholder="Optional phone" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={syncRole} onValueChange={(v) => setSyncRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super-admin">Super Admin</SelectItem>
                    <SelectItem value="zone-leader">Zone Leader</SelectItem>
                    <SelectItem value="area-leader">Area Leader</SelectItem>
                    <SelectItem value="cell-leader">Cell Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Zone ID</Label>
                  <Input value={syncZoneId} onChange={(e) => setSyncZoneId(e.target.value)} placeholder="Optional zone_id" />
                </div>
                <div>
                  <Label>Area ID</Label>
                  <Input value={syncAreaId} onChange={(e) => setSyncAreaId(e.target.value)} placeholder="Optional area_id" />
                </div>
                <div>
                  <Label>Cell ID</Label>
                  <Input value={syncCellId} onChange={(e) => setSyncCellId(e.target.value)} placeholder="Optional cell_id" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setShowSyncFromAuth(false)}>Cancel</Button>
                <Button onClick={async () => {
                  if (!syncAuthId || !syncName.trim()) {
                    toast({ title: 'Validation Error', description: 'Auth User ID and Full Name are required.', variant: 'destructive' });
                    return;
                  }
                  try {
                    await addUserWithId(syncAuthId, {
                      name: syncName.trim(),
                      phone: syncPhone || undefined,
                      role: syncRole,
                      zone_id: syncZoneId || undefined,
                      area_id: syncAreaId || undefined,
                      cell_id: syncCellId || undefined,
                      is_active: true,
                    } as any);
                    try { await refreshData(); } catch {}
                    toast({ title: 'Synced', description: 'User profile created from Auth.' });
                    setShowSyncFromAuth(false);
                    setSyncAuthId(''); setSyncName(''); setSyncPhone(''); setSyncRole('super-admin'); setSyncZoneId(''); setSyncAreaId(''); setSyncCellId('');
                  } catch (e: any) {
                    toast({ title: 'Sync Failed', description: e?.message || 'Could not create profile from Auth id.', variant: 'destructive' });
                  }
                }}>Sync</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Area Details Modal */}
      {showAreaDetails && selectedArea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedArea.name} - Area Details</h2>
                <p className="text-muted-foreground">Comprehensive overview of area performance and structure</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAreaDetails(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Area Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Area Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{selectedArea.totalCells}</p>
                      <p className="text-sm text-muted-foreground">Total Cells</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{selectedArea.totalMembers}</p>
                      <p className="text-sm text-muted-foreground">Total Members</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedArea.averageAttendance}%</p>
                      <p className="text-sm text-muted-foreground">Avg Attendance</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">₵{selectedArea.totalOfferings.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Offerings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Area Leadership & District Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Area Leadership & District</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Area Leader</p>
                      <p className="font-medium text-foreground">{(selectedArea as any).leaderName || (selectedArea as any).areaLeaderName || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">District Leader</p>
                      <p className="font-medium text-foreground">{(selectedArea as any).district_leader || (selectedArea as any).districtLeader || (selectedArea as any).districtLeaderName || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">District Pastor</p>
                      <p className="font-medium text-foreground">{(selectedArea as any).district_pastor || (selectedArea as any).districtPastor || (selectedArea as any).districtPastorName || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">District Name</p>
                      <p className="font-medium text-foreground">{(selectedArea as any).district_name || (selectedArea as any).districtName || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Leader Contact</p>
                      <p className="font-medium text-foreground">{(() => {
                        const leader = users.find(u => u.id === (selectedArea as any).leader_id);
                        return leader?.phone || '—';
                      })()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cells in Area */}
              <Card>
                <CardHeader>
                  <CardTitle>Cells in {selectedArea.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {cells.filter(cell => cell.area_id === selectedArea.id).length > 0 ? (
                    <div className="space-y-3">
                      {cells.filter(cell => cell.area_id === selectedArea.id).map(cell => {
                        const cellMeetings = meetings.filter(m => m.cell_id === cell.id);
                        const totalAttendance = cellMeetings.reduce((sum, m) => sum + (m.attendance_count || 0), 0);
                        const totalOfferings = cellMeetings.reduce((sum, m) => sum + (m.offering_amount || 0), 0);
                        const averageAttendance = cellMeetings.length > 0 ? Math.round(totalAttendance / cellMeetings.length) : 0;
                        
                        return (
                          <div key={cell.id} className="flex items-center justify-between p-4 rounded-lg border">
                            <div>
                              <p className="font-medium">{cell.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {members.filter(m => m.cell_id === cell.id).length} members • {(cell.meeting_day || 'Meeting day')}s at {cell.meeting_time || 'TBD'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Created: {new Date(cell.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <Badge variant={cell.status === 'active' ? 'default' : 'secondary'}>
                                {cell.status}
                              </Badge>
                              <p className="text-sm text-muted-foreground">
                                {cellMeetings.length} meetings • {averageAttendance}% attendance
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ₵{totalOfferings.toLocaleString()} total offerings
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Church className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No cells in this area yet</p>
                      <p className="text-sm text-muted-foreground">
                        Cells will appear here once they are created
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Meetings */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Meetings</CardTitle>
                </CardHeader>
                <CardContent>
                  {meetings.filter(m => cells.find(c => c.id === m.cell_id)?.area_id === selectedArea.id).length > 0 ? (
                    <div className="space-y-3">
                      {meetings
                        .filter(m => cells.find(c => c.id === m.cell_id)?.area_id === selectedArea.id)
                        .slice(0, 5)
                        .map(meeting => (
                          <div key={meeting.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">
                                {cells.find(c => c.id === meeting.cell_id)?.name || 'Unknown Cell'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(meeting.date).toLocaleDateString()} • {meeting.attendance_count || 0} attendees
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">₵{(meeting.offering_amount || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No meetings recorded yet</p>
                      <p className="text-sm text-muted-foreground">
                        Meeting records will appear here once they are created
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{reportData.title}</h2>
                <p className="text-muted-foreground">{reportData.period}</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={exportReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeReportModal}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Report Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{reportData.summary?.totalZones ?? zones.length}</p>
                      <p className="text-sm text-muted-foreground">Total Zones</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{reportData.summary?.totalAreas ?? areas.length}</p>
                      <p className="text-sm text-muted-foreground">Total Areas</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{reportData.summary?.totalCells ?? cells.length}</p>
                      <p className="text-sm text-muted-foreground">Total Cells</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{reportData.summary?.totalMembers ?? members.length}</p>
                      <p className="text-sm text-muted-foreground">Total Members</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{reportData.summary?.totalMeetings ?? meetings.length}</p>
                      <p className="text-sm text-muted-foreground">Total Meetings</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{reportData.summary?.totalAttendance ?? meetings.reduce((s,m)=>s+(m.attendance_count||0),0)}</p>
                      <p className="text-sm text-muted-foreground">Total Attendance</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">₵{(reportData.summary?.totalOfferings ?? meetings.reduce((s,m)=>s+(m.offering_amount||0),0)).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Offerings</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{reportData.summary?.averageAttendance ?? (meetings.length>0?Math.round(meetings.reduce((s,m)=>s+(m.attendance_count||0),0)/meetings.length):0)}%</p>
                      <p className="text-sm text-muted-foreground">Avg Attendance</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{reportData.summary?.totalVisitors ?? 0}</p>
                      <p className="text-sm text-muted-foreground">Total Visitors</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{reportData.summary?.totalConverts ?? 0}</p>
                      <p className="text-sm text-muted-foreground">New Converts</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{reportData.summary?.totalFollowups ?? 0}</p>
                      <p className="text-sm text-muted-foreground">Follow-ups</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-slate-700">{reportData.summary?.totalVisits ?? 0}</p>
                      <p className="text-sm text-muted-foreground">Visits Made</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>{reportData.areas ? 'Area Performance' : 'Zone Performance'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(reportData.areas || reportData.zones || []).map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                        <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {reportData.areas ? `${item.cells} cells, ${item.members} members` : `${item.areas} areas, ${item.cells} cells`}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold text-primary">{(item.attendance ?? item.averageAttendance ?? 0)} {reportData.areas ? 'attendance' : '% avg attendance'}</p>
                          <p className="text-sm text-muted-foreground">
                            ₵{(item.offerings ?? item.totalOfferings ?? 0).toLocaleString()} offerings
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Add New Area Modal */}
      {showAddAreaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Area</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddAreaModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="areaName">Area Name</Label>
                <Input
                  id="areaName"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  placeholder="Enter area name"
                />
              </div>
              
              <div>
                <Label htmlFor="areaDescription">Description</Label>
                <Textarea
                  id="areaDescription"
                  value={newArea.description}
                  onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
                  placeholder="Enter area description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leaderName">Area Leader Name</Label>
                  <Input
                    id="leaderName"
                    value={newArea.leaderName}
                    onChange={(e) => setNewArea({ ...newArea, leaderName: e.target.value })}
                    placeholder="Enter area leader full name"
                  />
                </div>
                <div>
                  <Label htmlFor="leaderEmail">Area Leader Email</Label>
                  <Input
                    id="leaderEmail"
                    type="email"
                    value={newArea.leaderEmail}
                    onChange={(e) => setNewArea({ ...newArea, leaderEmail: e.target.value })}
                    placeholder="Enter Area leader email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leaderPhone">Area Leader Phone</Label>
                  <Input
                    id="leaderPhone"
                    value={newArea.leaderPhone}
                    onChange={(e) => setNewArea({ ...newArea, leaderPhone: e.target.value })}
                    placeholder="Enter area leader phone"
                  />
                </div>
                <div>
                  <Label htmlFor="districtName">District Name</Label>
                  <Input
                    id="districtName"
                    value={newArea.districtName}
                    onChange={(e) => setNewArea({ ...newArea, districtName: e.target.value })}
                    placeholder="Enter district name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zoneSelect">Zone</Label>
                  <Select
                    value={newArea.zoneId}
                    onValueChange={(value) => setNewArea({ ...newArea, zoneId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((z: any) => (
                        <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="areaLeaderName">Areaone Leader (Display)</Label>
                  <Input
                    id="areaLeaderName"
                    value={newArea.areaLeaderName}
                    onChange={(e) => setNewArea({ ...newArea, areaLeaderName: e.target.value })}
                    placeholder="Enter area leader name"
                  />
                </div>
                <div>
                  <Label htmlFor="areaLeaderName">Area Leader</Label>
                  <Input
                    id="areaLeaderName"
                    value={newArea.areaLeaderName}
                    onChange={(e) => setNewArea({ ...newArea, areaLeaderName: e.target.value })}
                    placeholder="Enter area leader name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="districtLeaderName">District Leader</Label>
                  <Input
                    id="districtLeaderName"
                    value={newArea.districtLeaderName}
                    onChange={(e) => setNewArea({ ...newArea, districtLeaderName: e.target.value })}
                    placeholder="Enter district leader name"
                  />
                </div>
                <div>
                  <Label htmlFor="districtPastorName">District Pastor</Label>
                  <Input
                    id="districtPastorName"
                    value={newArea.districtPastorName}
                    onChange={(e) => setNewArea({ ...newArea, districtPastorName: e.target.value })}
                    placeholder="Enter district pastor name"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (!newArea.name || !newArea.zoneId) {
                      toast({
                        title: 'Validation Error',
                        description: 'Area name and zone are required.',
                        variant: 'destructive'
                      });
                      return;
                    }
                    const leader = {
                      id: `user_${Date.now()}`,
                      name: newArea.leaderName,
                      email: newArea.leaderEmail,
                      role: 'area-leader' as const,
                      areaId: undefined,
                      phone: newArea.leaderPhone,
                      is_active: true,
                      created_at: new Date(),
                      lastLogin: new Date()
                    };
                    const areaPayload = {
                      name: newArea.name,
                      description: newArea.description,
                      zone_id: newArea.zoneId,
                      district_name: newArea.districtName,
                      status: 'active' as const,
                    } as any;
                    // @ts-ignore addArea provided by context/service expects supabase shape
                    addArea(areaPayload);
                    toast({ title: 'Area Created', description: 'Area has been added.' });
                    setNewArea({
                      name: '',
                      description: '',
                      leaderName: '',
                      leaderEmail: '',
                      leaderPhone: '',
                      districtName: '',
                      areaLeaderName: '',       
                      districtLeaderName: '',
                      districtPastorName: '',
                      zoneId: ''
                    });
                    setShowAddAreaModal(false);
                  }}
                  disabled={!newArea.name || !newArea.zoneId}
                >
                  Create area
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddAreaModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">User Management</h2>
                <div className="flex space-x-2">
                  <Button onClick={() => setCreateUserModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New User
                  </Button>
                  {!simpleUserUI && (
                    <Button variant="outline" onClick={() => setShowSyncFromAuth(true)}>
                      Sync from Auth
                    </Button>
                  )}
                  <Button variant={simpleUserUI ? 'default' : 'outline'} onClick={() => setSimpleUserUI(!simpleUserUI)}>
                    {simpleUserUI ? 'Simple mode' : 'Advanced mode'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserManagement(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Users</CardTitle>
                  <CardDescription>Manage all users in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!simpleUserUI && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label>Role</Label>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All roles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="super-admin">Super Admin</SelectItem>
                            <SelectItem value="zone-leader">Zone Leader</SelectItem>
                            <SelectItem value="area-leader">Area Leader</SelectItem>
                            <SelectItem value="cell-leader">Cell Leader</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Zone ID</Label>
                        <Input value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} placeholder="Filter by zone_id" />
                      </div>
                      <div>
                        <Label>Area ID</Label>
                        <Input value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} placeholder="Filter by area_id" />
                      </div>
                      <div>
                        <Label>Cell ID</Label>
                        <Input value={cellFilter} onChange={(e) => setCellFilter(e.target.value)} placeholder="Filter by cell_id" />
                      </div>
                    </div>
                    )}

                    {users
                      .filter(u => (!simpleUserUI && roleFilter !== 'all' ? u.role === roleFilter : true))
                      .filter(u => (!simpleUserUI && zoneFilter ? ((u as any).zone_id || '').includes(zoneFilter) : true))
                      .filter(u => (!simpleUserUI && areaFilter ? ((u as any).area_id || '').includes(areaFilter) : true))
                      .filter(u => (!simpleUserUI && cellFilter ? ((u as any).cell_id || '').includes(cellFilter) : true))
                      .map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <UserCheck className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            {/* email not present on supabase User */}
                            <p className="text-xs text-muted-foreground">
                              Last login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : '—'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant={user.role === 'super-admin' ? 'destructive' : user.role === 'area-leader' ? 'default' : 'secondary'}>
                            {user.role.replace('-', ' ')}
                          </Badge>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'active' : 'inactive'}
                          </Badge>
                          
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUserStatus(user.id)}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddUserModal(false);
                  setEditingUser(null);
                  setNewUser({
                    name: '',
                    email: '',
                    role: 'cell-leader',
                    phone: '',
                    password: ''
                  });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="userName">Full Name *</Label>
                <Input
                  id="userName"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <Label htmlFor="userEmail">Email *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="userPhone">Phone Number</Label>
                <Input
                  id="userPhone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="userRole">Role *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'super-admin' | 'zone-leader' | 'area-leader' | 'cell-leader') => 
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cell-leader">Cell Leader</SelectItem>
                    <SelectItem value="area-leader">Area Leader</SelectItem>
                    <SelectItem value="zone-leader">Zone Leader</SelectItem>
                    <SelectItem value="super-admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {!editingUser && (
                <div>
                  <Label htmlFor="userPassword">Password *</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
              )}
              
              <div className="flex space-x-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={editingUser ? handleUpdateUser : handleAddUser}
                  disabled={!newUser.name || !newUser.email || (!editingUser && !newUser.password)}
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setEditingUser(null);
                    setNewUser({
                      name: '',
                      email: '',
                      role: 'cell-leader',
                      phone: '',
                      password: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Settings Modal */}
      {showSystemSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">System Settings</h2>
              <div className="flex space-x-2">
                <Button onClick={handleSaveSystemSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button variant="outline" onClick={handleResetSystemSettings}>
                  Reset to Defaults
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSystemSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Church Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Church Information</CardTitle>
                  <CardDescription>Basic church details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="churchName">Church Name</Label>
                    <Input
                      id="churchName"
                      value={systemConfig.churchName}
                      onChange={(e) => setSystemConfig({ ...systemConfig, churchName: e.target.value })}
                      placeholder="Enter church name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={systemConfig.contactEmail}
                        onChange={(e) => setSystemConfig({ ...systemConfig, contactEmail: e.target.value })}
                        placeholder="Enter contact email"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        value={systemConfig.contactPhone}
                        onChange={(e) => setSystemConfig({ ...systemConfig, contactPhone: e.target.value })}
                        placeholder="Enter contact phone"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Core system settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={systemConfig.timezone}
                        onValueChange={(value) => setSystemConfig({ ...systemConfig, timezone: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Accra">Africa/Accra (GMT+0)</SelectItem>
                          <SelectItem value="Africa/Lagos">Africa/Lagos (GMT+1)</SelectItem>
                          <SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={systemConfig.dateFormat}
                        onValueChange={(value) => setSystemConfig({ ...systemConfig, dateFormat: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={systemConfig.currency}
                        onValueChange={(value) => setSystemConfig({ ...systemConfig, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GHS">GHS (Ghana Cedi)</SelectItem>
                          <SelectItem value="NGN">NGN (Nigerian Naira)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxCellSize">Maximum Cell Size</Label>
                      <Input
                        id="maxCellSize"
                        type="number"
                        value={systemConfig.maxCellSize}
                        onChange={(e) => setSystemConfig({ ...systemConfig, maxCellSize: parseInt(e.target.value) })}
                        min="5"
                        max="50"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="backupFrequency">Backup Frequency</Label>
                      <Select
                        value={systemConfig.backupFrequency}
                        onValueChange={(value) => setSystemConfig({ ...systemConfig, backupFrequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure how notifications are sent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send notifications via email</p>
                      </div>
                      <Select
                        value={systemConfig.notificationSettings.emailNotifications ? 'enabled' : 'disabled'}
                        onValueChange={(value) => setSystemConfig({
                          ...systemConfig,
                          notificationSettings: {
                            ...systemConfig.notificationSettings,
                            emailNotifications: value === 'enabled'
                          }
                        })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                      </div>
                      <Select
                        value={systemConfig.notificationSettings.smsNotifications ? 'enabled' : 'disabled'}
                        onValueChange={(value) => setSystemConfig({
                          ...systemConfig,
                          notificationSettings: {
                            ...systemConfig.notificationSettings,
                            smsNotifications: value === 'enabled'
                          }
                        })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="pushNotifications">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send push notifications</p>
                      </div>
                      <Select
                        value={systemConfig.notificationSettings.pushNotifications ? 'enabled' : 'disabled'}
                        onValueChange={(value) => setSystemConfig({
                          ...systemConfig,
                          notificationSettings: {
                            ...systemConfig.notificationSettings,
                            pushNotifications: value === 'enabled'
                          }
                        })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
      {/* Add Zone Modal */}
      <Dialog open={showAddZoneModal} onOpenChange={setShowAddZoneModal}>
        <DialogContent className="w-96 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Zone</DialogTitle>
            <DialogDescription>Create a new zone and assign a zone leader</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Zone Name</Label>
              <Input 
                type="text" 
                value={newZone.name} 
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="Enter zone name"
              />
            </div>
            <div>
              <Label>Zone Leader Name</Label>
              <Input 
                type="text" 
                value={newZone.leaderName} 
                onChange={(e) => setNewZone({ ...newZone, leaderName: e.target.value })}
                placeholder="Enter leader name"
              />
            </div>
            <div>
              <Label>Leader Email</Label>
              <Input 
                type="email" 
                value={newZone.leaderEmail} 
                onChange={(e) => setNewZone({ ...newZone, leaderEmail: e.target.value })}
                placeholder="Enter leader email"
              />
            </div>
            <div>
              <Label>Leader Phone</Label>
              <Input 
                type="tel" 
                value={newZone.leaderPhone} 
                onChange={(e) => setNewZone({ ...newZone, leaderPhone: e.target.value })}
                placeholder="Enter leader phone"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={newZone.description} 
                onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                placeholder="Enter zone description"
                rows={2}
              />
            </div> 
            <div> 
              <Label>District Name</Label>
              <Input 
                type="text" 
                value={newZone.districtName} 
                onChange={(e) => setNewZone({ ...newZone, districtName: e.target.value })}
                placeholder="Enter district name"
              />
            </div>
            <div>
              <Label>District Leader</Label>
              <Input 
                type="text" 
                value={newZone.districtLeader} 
                onChange={(e) => setNewZone({ ...newZone, districtLeader: e.target.value })}
                placeholder="Enter district leader name"
              />
            </div>
            <div>
              <Label>District Pastor</Label>
              <Input 
                type="text" 
                value={newZone.districtPastor} 
                onChange={(e) => setNewZone({ ...newZone, districtPastor: e.target.value })}
                placeholder="Enter district pastor name"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={newZone.status} 
                onValueChange={(value) => setNewZone({ ...newZone, status: value })}
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
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddZoneModal(false)}>Cancel</Button>
            <Button onClick={handleAddNewZone}>Create Zone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Zone Modal */}
      {showEditZoneModal && editingZone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Zone</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowEditZoneModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={zoneForm.description} onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })} rows={3} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={zoneForm.status} onValueChange={(v) => setZoneForm({ ...zoneForm, status: v as 'active' | 'inactive' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setShowEditZoneModal(false)}>Cancel</Button>
                <Button onClick={handleSaveZone}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create User (Provision) Modal */}
      <CreateUserModal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        onUserCreated={async () => {
          // Keep the modal open so its credentials view is shown
          try { await refreshData(); } catch {}
          toast({ title: 'User Created', description: 'Credentials are shown below. Copy and share securely.' });
        }}
        availableZones={zones.map(z => ({ id: z.id, name: z.name }))}
        availableAreas={areas.map(a => ({ id: a.id, name: a.name, zoneId: a.zone_id }))}
      />
    </div>
  );

};

export default SuperAdminDashboard;