import { useState } from "react";
import { authService } from "@/services/supabaseService";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { CreateUserModal } from "@/components/CreateUserModal";
import { Navigation } from "@/components/Navigation";
import AlertNotifications from "@/components/AlertNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateMemorablePassword } from "@/lib/utils";
import { 
  Users, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Download,
  FileText,
  PieChart,
  Activity,
  ArrowLeft
} from "lucide-react";

const AreaLeaderDashboard = () => {
  const { user, logout } = useAuth();
  const { areas, cells, meetings, users, members, addCell, updateCell, deleteCell, addUser, updateUser, updateArea, deleteArea, isLoading, refreshData } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Cell management state
  const [showAddCellDialog, setShowAddCellDialog] = useState(false);
  const [showEditCellDialog, setShowEditCellDialog] = useState(false);
  const [editingCell, setEditingCell] = useState<any>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  // Area actions state
  const [showViewAreaDialog, setShowViewAreaDialog] = useState(false);
  const [showEditAreaDialog, setShowEditAreaDialog] = useState(false);
  const [areaForm, setAreaForm] = useState<{ name: string; description: string; district_name: string; district_leader: string; district_pastor: string; status: 'active' | 'inactive' }>({ name: '', description: '', district_name: '', district_leader: '', district_pastor: '', status: 'active' });
  // Assign Cell Leader state
  const [showAssignLeaderDialog, setShowAssignLeaderDialog] = useState(false);
  const [assignForCell, setAssignForCell] = useState<any>(null);
  const [assignMode, setAssignMode] = useState<'existing' | 'new'>('existing');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newLeaderName, setNewLeaderName] = useState<string>('');
  const [newLeaderEmail, setNewLeaderEmail] = useState<string>('');
  const [newLeaderPhone, setNewLeaderPhone] = useState<string>('');
  const [assignedCreds, setAssignedCreds] = useState<{ email: string; password: string } | null>(null);
  const [showCredsDialog, setShowCredsDialog] = useState(false);
  const [cellFormData, setCellFormData] = useState({
    name: "",
    leaderName: "",
    leaderEmail: "",
    leaderPhone: "",
    meetingDay: "",
    meetingTime: "",
    location: "",
    description: "",
    zoneName: "",
    zoneLeader: "",
    districtName: "",
    districtLeader: "",
    districtPastor: "",
    status: "active"
  });

  // Resolve current area by leader assignment or user's area_id
  const currentArea = (areas as any[]).find(a => (a as any).leader_id === user?.id) || (areas as any[]).find(a => a.id === (user as any)?.area_id);
  
  // Get cells for this area
  const areaCells = (cells as any[]).filter(cell => (cell as any).area_id === currentArea?.id);
  
  // Get meetings for this area
  const areaMeetings = (meetings as any[]).filter(meeting => 
    areaCells.some(cell => cell.id === (meeting as any).cell_id)
  );

  // Calculate statistics
  const totalCells = areaCells.length;
  const cellIdsForArea = new Set(areaCells.map(c => c.id));
  const totalMembers = (members as any[]).filter(m => cellIdsForArea.has((m as any).cell_id)).length;
  const activeMembers = (members as any[]).filter(m => cellIdsForArea.has((m as any).cell_id) && (m as any).status === 'active').length;
  const totalMeetings = areaMeetings.length;
  const totalOfferings = areaMeetings.reduce((sum: number, meeting: any) => sum + (meeting.offering_amount || 0), 0);
  const averageAttendance = totalMeetings > 0 
    ? Math.round(areaMeetings.reduce((sum: number, meeting: any) => sum + (meeting.attendance_count || 0), 0) / totalMeetings)
    : 0;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openViewArea = () => {
    setShowViewAreaDialog(true);
  };

  const openEditArea = () => {
    if (!currentArea) return;
    setAreaForm({
      name: currentArea.name || '',
      description: (currentArea as any).description || '',
      district_name: (currentArea as any).district_name || '',
      district_leader: (currentArea as any).district_leader || '',
      district_pastor: (currentArea as any).district_pastor || '',
      status: (currentArea as any).status || 'active',
    });
    setShowEditAreaDialog(true);
  };

  const handleSaveAreaEdit = async () => {
    if (!currentArea) return;
    await updateArea(currentArea.id, {
      name: areaForm.name.trim(),
      description: areaForm.description,
      district_name: areaForm.district_name,
      district_leader: areaForm.district_leader,
      district_pastor: areaForm.district_pastor,
      status: areaForm.status,
    } as any);
    toast({ title: 'Area Updated', description: 'Area details saved successfully.' });
    setShowEditAreaDialog(false);
  };

  const handleDeleteArea = async () => {
    if (!currentArea) return;
    if (!confirm('Delete this area? This will also remove all its cells and meetings.')) return;
    await deleteArea(currentArea.id);
    toast({ title: 'Area Deleted', description: 'Area removed successfully.' });
    setShowViewAreaDialog(false);
    navigate('/area-dashboard');
  };

  const handleOpenAssignLeader = (cell: any) => {
    setAssignForCell(cell);
    setAssignMode('existing');
    setSelectedUserId('');
    setNewLeaderName('');
    setNewLeaderEmail('');
    setNewLeaderPhone('');
    setShowAssignLeaderDialog(true);
  };

  const generatePassword = (name: string) => generateMemorablePassword(name);

  const handleAssignLeaderSave = async () => {
    if (!assignForCell) return;
    try {
      if (assignMode === 'existing') {
        if (!selectedUserId) {
          toast({ title: 'Select a User', description: 'Please select a user to assign as cell leader.', variant: 'destructive' });
          return;
        }
        await updateCell(assignForCell.id, { leader_id: selectedUserId } as any);
        await updateUser(selectedUserId, { cell_id: assignForCell.id, area_id: currentArea!.id } as any);
        toast({ title: 'Leader Assigned', description: 'Cell leader has been assigned successfully.' });
      } else {
        if (!newLeaderName.trim() || !newLeaderEmail.trim()) {
          toast({ title: 'Validation Error', description: 'Please enter leader name and email.', variant: 'destructive' });
          return;
        }
        const password = generatePassword(newLeaderName);
        const res: any = await authService.provisionUser({
          email: newLeaderEmail.trim(),
          password,
          name: newLeaderName.trim(),
          phone: newLeaderPhone || undefined,
          role: 'cell-leader' as any,
          area_id: currentArea!.id,
          cell_id: assignForCell.id,
        });
        const leaderId = res?.userId || res?.user?.id;
        const shownPwd = (res?.password as string) || password;

        // Always show credentials immediately (even if linking fails)
        setShowAssignLeaderDialog(false);
        try {
          await navigator.clipboard.writeText(`Email: ${newLeaderEmail}\nPassword: ${shownPwd}`);
          toast({ title: 'Leader Created', description: `Credentials copied. Email: ${newLeaderEmail} | Password: ${shownPwd}` });
        } catch {
          toast({ title: 'Leader Created', description: `Credentials — Email: ${newLeaderEmail} | Password: ${shownPwd}` });
        }
        setAssignedCreds({ email: newLeaderEmail.trim(), password: shownPwd });
        setShowCredsDialog(true);

        // Best-effort linking; do not block credentials UI
        if (leaderId) {
          try {
            await updateCell(assignForCell.id, { leader_id: leaderId } as any);
          } catch {}
          try {
            await updateUser(leaderId, { cell_id: assignForCell.id, area_id: currentArea!.id } as any);
          } catch {}
        }
      }
    } finally {
      setShowAssignLeaderDialog(false);
      setAssignForCell(null);
    }
  };

  // Cell management functions
  const resetCellForm = () => {
    setCellFormData({
      name: "",
      leaderName: "",
      leaderEmail: "",
      leaderPhone: "",
      meetingDay: "",
      meetingTime: "",
      location: "",
      description: "",
      zoneName: "",
      zoneLeader: "",
      districtName: "",
      districtLeader: "",
      districtPastor: "",
      status: "active"
    });
  };

  const handleAddCell = () => {
    resetCellForm();
    setShowAddCellDialog(true);
  };

  const handleEditCell = (cell: any) => {
    setEditingCell(cell);
    setCellFormData({
      name: cell.name || "",
      leaderName: (users.find(u => (u as any).id === (cell as any).leader_id)?.name) || "",
      leaderEmail: "",
      leaderPhone: users.find(u => (u as any).id === (cell as any).leader_id)?.phone || "",
      meetingDay: (cell as any).meeting_day || "",
      meetingTime: (cell as any).meeting_time || "",
      location: cell.location || "",
      description: cell.description || "",
      zoneName: (cell as any).zoneName || "",
      zoneLeader: (cell as any).zoneLeader || "",
      districtName: (cell as any).districtName || "",
      districtLeader: (cell as any).districtLeader || "",
      districtPastor: (cell as any).districtPastor || "",
      status: cell.status || "active"
    });
    setShowEditCellDialog(true);
  };

  const handleSaveCell = async () => {
    if (!cellFormData.name.trim()) {
      alert("Please enter a cell name");
      return;
    }

    try {
      if (editingCell) {
        // Update existing cell
        const updatedCell: any = {
          name: cellFormData.name,
          meeting_day: cellFormData.meetingDay,
          meeting_time: cellFormData.meetingTime,
          location: cellFormData.location,
          description: cellFormData.description,
          status: cellFormData.status as 'active' | 'inactive',
        };
        await updateCell((editingCell as any).id, updatedCell);
        setShowEditCellDialog(false);
        setEditingCell(null);
      } else {
        // Add new cell only. Area leaders cannot create users due to RLS.
        const newCell: any = {
          name: cellFormData.name,
          area_id: currentArea!.id,
          meeting_day: cellFormData.meetingDay,
          meeting_time: cellFormData.meetingTime,
          location: cellFormData.location,
          description: cellFormData.description,
          status: cellFormData.status as 'active' | 'inactive',
        };
        await addCell(newCell);
        setShowAddCellDialog(false);
        toast({ title: 'Success', description: 'Cell created successfully. Use "Assign Leader" to add a leader.' });
      }
    } catch (e: any) {
      toast({ title: 'Operation failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      resetCellForm();
    }
  };

  const handleDeleteCell = (cellId: string) => {
    if (confirm("Are you sure you want to delete this cell? This action cannot be undone.")) {
      deleteCell(cellId);
    }
  };

  // Report generation functions
  const generateAttendanceReport = async () => {
  await refreshData();
    const attendanceData = areaMeetings.map((meeting: any) => {
      const cell = areaCells.find(c => c.id === meeting.cell_id);
      const totalMembersForCell = (members as any[]).filter((m: any) => (m as any).cell_id === cell?.id).length;
      const attendeesCount = (meeting.attendance_count || 0);
      return {
        date: new Date(meeting.date).toLocaleDateString(),
        cellName: cell?.name || 'Unknown Cell',
        attendees: attendeesCount,
        totalMembers: totalMembersForCell,
        percentage: totalMembersForCell > 0 ? Math.round((attendeesCount / totalMembersForCell) * 100) : 0
      };
    });

    const report = {
      type: 'attendance',
      title: 'Area Attendance Report',
      areaName: currentArea?.name || 'Unknown Area',
      period: 'All Time',
      data: attendanceData,
      summary: {
        totalMeetings: areaMeetings.length,
        averageAttendance: areaMeetings.length > 0 ? Math.round(areaMeetings.reduce((sum: number, m: any) => sum + (m.attendance_count || 0), 0) / areaMeetings.length) : 0,
        totalMembers: totalMembers,
        bestAttendance: Math.max(...attendanceData.map(d => d.attendees), 0),
        worstAttendance: Math.min(...attendanceData.map(d => d.attendees), 0),
        totalVisitors: areaMeetings.reduce((s: number, m: any) => s + ((m as any).visitors_count || 0), 0),
        totalConverts: areaMeetings.reduce((s: number, m: any) => s + ((m as any).converts_count || 0), 0),
        totalFollowups: areaMeetings.reduce((s: number, m: any) => s + ((m as any).followups_count || 0), 0),
        totalVisits: areaMeetings.reduce((s: number, m: any) => s + ((m as any).visits_count || 0), 0),
      }
    };

    setReportData(report);
    setSelectedReport('attendance');
  };

  const generateGrowthReport = async () => {
  await refreshData();
    // Helper: get Monday-start week label and key
    const getWeekInfo = (d: Date) => {
      const date = new Date(d);
      const day = (date.getDay() + 6) % 7; // Monday=0
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setDate(date.getDate() + 6);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const label = `Week of ${date.toLocaleDateString()}`;
      return { key, label, start: date, end };
    };

    const weeklyData: Record<string, { week: string; meetings: number; attendees: number; offerings: number; cells: Set<string>; newMembers: number; visitors: number; converts: number; followups: number; visits: number }> = {};

    // Aggregate meetings by week
    for (const meeting of areaMeetings as any[]) {
      const info = getWeekInfo(new Date((meeting as any).date));
      if (!weeklyData[info.key]) {
        weeklyData[info.key] = { week: info.label, meetings: 0, attendees: 0, offerings: 0, cells: new Set<string>(), newMembers: 0, visitors: 0, converts: 0, followups: 0, visits: 0 };
      }
      weeklyData[info.key].meetings += 1;
      weeklyData[info.key].attendees += ((meeting as any).attendance_count || 0);
      weeklyData[info.key].offerings += ((meeting as any).offering_amount || 0);
      weeklyData[info.key].cells.add(String((meeting as any).cell_id));
      weeklyData[info.key].visitors += ((meeting as any).visitors_count || 0);
      weeklyData[info.key].converts += ((meeting as any).converts_count || 0);
      weeklyData[info.key].followups += ((meeting as any).followups_count || 0);
      weeklyData[info.key].visits += ((meeting as any).visits_count || 0);
    }

    // Count new members per week for cells in this area (based on members.date_joined)
    const areaCellIds = new Set((areaCells as any[]).map((c: any) => c.id));
    for (const m of members as any[]) {
      const joined = (m as any).date_joined;
      if (!joined || !areaCellIds.has((m as any).cell_id)) continue;
      const info = getWeekInfo(new Date(joined));
      if (!weeklyData[info.key]) {
        weeklyData[info.key] = { week: info.label, meetings: 0, attendees: 0, offerings: 0, cells: new Set<string>(), newMembers: 0, visitors: 0, converts: 0, followups: 0, visits: 0 };
      }
      weeklyData[info.key].newMembers += 1;
    }

    const report = {
      type: 'growth',
      title: 'Area Growth Report',
      areaName: currentArea?.name || 'Unknown Area',
      period: 'Weekly Breakdown',
      data: (Object.keys(weeklyData) as string[]).sort().map((key) => {
        const entry = weeklyData[key];
        return {
          week: entry.week,
          meetings: entry.meetings,
          attendees: entry.attendees,
          offerings: entry.offerings,
          activeCells: entry.cells.size,
          newMembers: entry.newMembers || 0,
          visitors: entry.visitors || 0,
          converts: entry.converts || 0,
          followups: entry.followups || 0,
          visits: entry.visits || 0,
        };
      }),
      summary: {
        totalGrowth: Object.values(weeklyData).reduce((sum, e) => sum + (e.newMembers || 0), 0),
        activeCells: areaCells.filter(c => c.status === 'active').length,
        totalMembers,
        totalMeetings: areaMeetings.length,
        averageAttendance: Math.round(areaMeetings.reduce((sum, m) => sum + (m.attendance_count || 0), 0) / (areaMeetings.length || 1)),
        totalVisitors: Object.values(weeklyData).reduce((s, e) => s + (e.visitors || 0), 0),
        totalConverts: Object.values(weeklyData).reduce((s, e) => s + (e.converts || 0), 0),
        totalFollowups: Object.values(weeklyData).reduce((s, e) => s + (e.followups || 0), 0),
        totalVisits: Object.values(weeklyData).reduce((s, e) => s + (e.visits || 0), 0),
      }
    };

    setReportData(report);
    setSelectedReport('growth');
  };

  const generateOfferingReport = async () => {
  await refreshData();
    const offeringData = areaMeetings.map((meeting: any) => {
      const cell = areaCells.find(c => c.id === meeting.cell_id);
      return {
        date: new Date(meeting.date).toLocaleDateString(),
        cellName: cell?.name || 'Unknown Cell',
        offering: meeting.offering_amount || 0,
        attendees: meeting.attendance_count || 0,
        perPerson: (meeting.attendance_count || 0) > 0 ? Math.round((meeting.offering_amount || 0) / (meeting.attendance_count || 0)) : 0
      };
    });

    const report = {
      type: 'offering',
      title: 'Area Offering Report',
      areaName: currentArea?.name || 'Unknown Area',
      period: 'All Time',
      data: offeringData,
      summary: {
        totalOfferings,
        averageOffering: areaMeetings.length > 0 ? Math.round(totalOfferings / areaMeetings.length) : 0,
        highestOffering: offeringData.length > 0 ? Math.max(...offeringData.map(d => d.offering)) : 0,
        lowestOffering: offeringData.length > 0 ? Math.min(...offeringData.map(d => d.offering)) : 0,
        averagePerPerson: areaMeetings.length > 0 ? Math.round(totalOfferings / (offeringData.reduce((sum, d) => sum + d.attendees, 0) || 1)) : 0
      }
    };

    setReportData(report);
    setSelectedReport('offering');
  };

  const generateCellPerformanceReport = async () => {
  await refreshData();
    const cellData = areaCells.map((cell: any) => {
      const cellMeetings = areaMeetings.filter((m: any) => m.cell_id === cell.id);
      const cellOfferings = cellMeetings.reduce((sum: number, m: any) => sum + (m.offering_amount || 0), 0);
      const memberCount = (members as any[]).filter(m => (m as any).cell_id === cell.id).length;
      
      return {
        name: cell.name,
        leader: users.find(u => (u as any).id === (cell as any).leader_id)?.name || 'Not assigned',
        members: memberCount,
        meetings: cellMeetings.length,
        totalOfferings: cellOfferings,
        averageAttendance: cellMeetings.length > 0 ? Math.round(cellMeetings.reduce((sum, m) => sum + (m.attendance_count || 0), 0) / cellMeetings.length) : 0,
        meetingDay: (cell as any).meeting_day || 'Not set',
        status: cell.status,
        lastMeeting: cellMeetings.length > 0 ? Math.max(...cellMeetings.map((m: any) => new Date(m.date).getTime())) : null
      };
    });

    const report = {
      type: 'cellPerformance',
      title: 'Cell Performance Report',
      areaName: currentArea?.name || 'Unknown Area',
      period: 'Current Status',
      data: cellData,
      summary: {
        totalCells,
        activeCells: cellData.filter(c => c.status === 'active').length,
        totalMembers,
        totalMeetings: areaMeetings.length,
        averageAttendance: Math.round(cellData.reduce((sum, c) => sum + c.averageAttendance, 0) / (cellData.length || 1))
      }
    };

    setReportData(report);
    setSelectedReport('cellPerformance');
  };

  const generateCSV = (data: any) => {
    if (data.type === 'attendance') {
      const headers = ['Date', 'Cell Name', 'Attendees', 'Total Members', 'Attendance %'];
      const rows = data.data.map((row: any) => [row.date, row.cellName, row.attendees, row.totalMembers, row.percentage + '%']);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (data.type === 'growth') {
      const headers = ['Week', 'Meetings', 'Attendees', 'Offerings (GHS)', 'Active Cells', 'New Members', 'Visitors', 'Converts', 'Follow-ups', 'Visits'];
      const rows = (data.data as any[]).map((row) => [row.week, row.meetings, row.attendees, `₵${row.offerings}`, row.activeCells, row.newMembers || 0, row.visitors || 0, row.converts || 0, row.followups || 0, row.visits || 0]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (data.type === 'offering') {
      const headers = ['Date', 'Cell Name', 'Offering (GHS)', 'Attendees', 'Per Person (GHS)'];
      const rows = data.data.map((row: any) => [row.date, row.cellName, `₵${row.offering}`, row.attendees, `₵${row.perPerson}`]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (data.type === 'cellPerformance') {
      const headers = ['Cell Name', 'Leader', 'Members', 'Meetings', 'Total Offerings (GHS)', 'Avg Attendance', 'Meeting Day', 'Status'];
      const rows = data.data.map((row: any) => [row.name, row.leader, row.members, row.meetings, `₵${row.totalOfferings}`, row.averageAttendance, row.meetingDay, row.status]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    return '';
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const csvContent = generateCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.title.replace(/\s+/g, '_')}_${currentArea?.name || 'Area'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Do not block the page on initial load; show a subtle inline banner instead

  if (!currentArea && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-foreground mb-2">No Area Assigned</h1>
            <p className="text-muted-foreground mb-4">
              You don't have an area assigned yet. Please contact your administrator.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Area Leader Dashboard
            </h1>
            <p className="text-muted-foreground">
              Area: {currentArea.name} • Leader: {user?.name}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Alert Notifications */}
        <div className="mb-8">
          <AlertNotifications userRole="area-leader" />
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cells</p>
                  <p className="text-2xl font-bold text-foreground">{totalCells}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
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
                <Activity className="h-8 w-8 text-green-500" />
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
                <Calendar className="h-8 w-8 text-blue-500" />
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
            <TabsTrigger value="cells">Cells</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Area Information</CardTitle>
                <CardDescription>Overview of your area's performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    Manage your area details or view full information.
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={openViewArea}>View</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Area Name</p>
                    <p className="font-medium text-foreground">{currentArea.name}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Active Cells</p>
                    <p className="font-medium text-foreground">{totalCells}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Average Attendance</p>
                    <p className="font-medium text-foreground">{averageAttendance}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Cell Performance</h3>
                  <div className="space-y-3">
                    {areaCells.map((cell: any) => {
                      const cellMeetings = areaMeetings.filter((m: any) => m.cell_id === cell.id);
                      const cellOfferings = cellMeetings.reduce((sum: number, m: any) => sum + (m.offering_amount || 0), 0);
                      const memberCount = (members as any[]).filter(m => (m as any).cell_id === cell.id).length;
                      return (
                        <div key={cell.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{cell.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {memberCount} members • {cellMeetings.length} meetings
                            </p>
                          </div>
                        {/* Removed reportData KPIs from Overview cell list to avoid null reference; KPIs are shown in Reports tab */}
                          <div className="text-right">
                            <p className="font-bold">₵{cellOfferings.toLocaleString()}</p>
                            <Badge variant={cell.status === 'active' ? 'default' : 'secondary'}>
                              {cell.status}
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

          <TabsContent value="cells" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Area Cells</h2>
                    <p className="text-muted-foreground">Manage cells within your area</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShowCreateUserModal(true)}
                      variant="outline"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Create User
                    </Button>
                    <Button onClick={() => setShowAddCellDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Cell
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {areaCells.length > 0 ? (
                  <div className="space-y-3">
                    {areaCells.map((cell: any) => (
                      <div key={cell.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{cell.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Leader: {users.find(u => (u as any).id === (cell as any).leader_id)?.name || 'Not assigned'} • {members.filter((m: any) => (m as any).cell_id === cell.id).length} members
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(cell as any).meeting_day || ''} {(cell as any).meeting_time || ''}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={cell.status === 'active' ? 'default' : 'secondary'}>
                            {cell.status}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => handleOpenAssignLeader(cell)}>
                            Assign Leader
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditCell(cell)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCell(cell.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No cells created yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start by adding your first cell
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
                <CardDescription>Overview of recent cell meetings in your area</CardDescription>
              </CardHeader>
              <CardContent>
                {areaMeetings.length > 0 ? (
                  <div className="space-y-3">
                    {areaMeetings.slice(0, 10).map((meeting: any) => {
                      const cell = areaCells.find(c => c.id === meeting.cell_id);
                      return (
                        <div key={meeting.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div>
                            <p className="font-medium">{cell?.name || 'Unknown Cell'}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(meeting.date).toLocaleDateString()}
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
                      Meetings will appear here once cell leaders start recording them
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assign Cell Leader Dialog */}
          <Dialog open={showAssignLeaderDialog} onOpenChange={setShowAssignLeaderDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Cell Leader</DialogTitle>
                <DialogDescription>
                  {assignForCell ? `Assign a leader to cell: ${assignForCell.name}` : ''}
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
                        <SelectValue placeholder="Choose a cell leader" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter((u: any) => (u as any).role === 'cell-leader')
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
                      <Input type="email" value={newLeaderEmail} onChange={(e) => setNewLeaderEmail(e.target.value)} placeholder="email@example.com" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={newLeaderPhone} onChange={(e) => setNewLeaderPhone(e.target.value)} placeholder="Phone (optional)" />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAssignLeaderDialog(false)}>Cancel</Button>
                <Button onClick={handleAssignLeaderSave}>Assign Leader</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

      {/* View Area Dialog */}
      <Dialog open={showViewAreaDialog} onOpenChange={setShowViewAreaDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Area Details</DialogTitle>
            <DialogDescription>Overview for {currentArea?.name || ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{(currentArea as any)?.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">District Name</p>
                <p className="font-medium">{(currentArea as any)?.district_name || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">District Leader</p>
                <p className="font-medium">{(currentArea as any)?.district_leader || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">District Pastor</p>
                <p className="font-medium">{(currentArea as any)?.district_pastor || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Description</p>
              <p className="font-medium whitespace-pre-wrap">{(currentArea as any)?.description || '—'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewAreaDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Area Dialog */}
      <Dialog open={showEditAreaDialog} onOpenChange={setShowEditAreaDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
            <DialogDescription>Update the details of your area</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Area Name</Label>
              <Input value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} />
            </div>
            <div>
              <Label>District Name</Label>
              <Input value={areaForm.district_name} onChange={(e) => setAreaForm({ ...areaForm, district_name: e.target.value })} />
            </div>
            <div>
              <Label>District Leader</Label>
              <Input value={areaForm.district_leader} onChange={(e) => setAreaForm({ ...areaForm, district_leader: e.target.value })} />
            </div>
            <div>
              <Label>District Pastor</Label>
              <Input value={areaForm.district_pastor} onChange={(e) => setAreaForm({ ...areaForm, district_pastor: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={areaForm.description} onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={areaForm.status} onValueChange={(value) => setAreaForm({ ...areaForm, status: value as 'active' | 'inactive' })}>
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
            <Button variant="outline" onClick={() => setShowEditAreaDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveAreaEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

          <TabsContent value="reports" className="space-y-4">
            {!selectedReport ? (
              <Card>
                <CardHeader>
                  <CardTitle>Area Reports</CardTitle>
                  <CardDescription>Generate comprehensive reports for your area</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={generateAttendanceReport} 
                    className="w-full h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                    variant="outline"
                  >
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Generate Attendance Report</p>
                    </div>
                  </Button>
                  <Button 
                    onClick={generateGrowthReport} 
                    className="w-full h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                    variant="outline"
                  >
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Generate Growth Report</p>
                    </div>
                  </Button>
                  <Button 
                    onClick={generateOfferingReport} 
                    className="w-full h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                    variant="outline"
                  >
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Generate Offering Report</p>
                    </div>
                  </Button>
                  <Button 
                    onClick={generateCellPerformanceReport} 
                    className="w-full h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                    variant="outline"
                  >
                    <div className="text-center">
                      <PieChart className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium">Generate Cell Performance Report</p>
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
                        {reportData?.areaName} • {reportData?.period}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={exportReport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Reports
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reportData && reportData.type === 'attendance' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Attendance Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-primary">{reportData.summary.totalMeetings}</p>
                            <p className="text-sm text-muted-foreground">Total Meetings</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{reportData.summary.averageAttendance}</p>
                            <p className="text-sm text-muted-foreground">Average Attendance</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-orange-600">{reportData.summary.totalMembers}</p>
                            <p className="text-sm text-muted-foreground">Total Members</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">{reportData.summary.bestAttendance}</p>
                            <p className="text-sm text-muted-foreground">Best Attendance</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-primary">{reportData.summary.totalVisitors || 0}</p>
                            <p className="text-sm text-muted-foreground">Total Visitors</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{reportData.summary.totalConverts || 0}</p>
                            <p className="text-sm text-muted-foreground">New Converts</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-orange-600">{reportData.summary.totalFollowups || 0}</p>
                            <p className="text-sm text-muted-foreground">Follow-ups</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-slate-700">{reportData.summary.totalVisits || 0}</p>
                            <p className="text-sm text-muted-foreground">Visits Made</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold mb-3">Attendance Details</h3>
                          {reportData.data.map((row: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="font-medium">{row.cellName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {row.attendees} attendees • {row.totalMembers} members
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="font-bold text-green-600">{row.percentage}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {reportData && reportData.type === 'growth' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Growth Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-primary">{reportData.summary.totalGrowth}</p>
                            <p className="text-sm text-muted-foreground">Total Growth</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{reportData.summary.averageAttendance}</p>
                            <p className="text-sm text-muted-foreground">Avg Attendance</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-orange-600">{reportData.summary.totalMembers}</p>
                            <p className="text-sm text-muted-foreground">Total Members</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{reportData.summary.activeCells}</p>
                            <p className="text-sm text-muted-foreground">Active Cells</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-primary">{reportData.summary.totalVisitors}</p>
                            <p className="text-sm text-muted-foreground">Total Visitors</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-green-700">{reportData.summary.totalConverts}</p>
                            <p className="text-sm text-muted-foreground">New Converts</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-orange-600">{reportData.summary.totalFollowups}</p>
                            <p className="text-sm text-muted-foreground">Follow-ups</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-slate-700">{reportData.summary.totalVisits}</p>
                            <p className="text-sm text-muted-foreground">Visits Made</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold mb-3">Growth Details</h3>
                          {reportData.data.map((row: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="font-medium">{row.week}</p>
                                <p className="text-sm text-muted-foreground">
                                  {row.meetings} meetings • {row.attendees} attendees
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="font-bold text-green-600">₵{(row.offerings || 0).toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">{row.newMembers || 0} new members</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {reportData && reportData.type === 'offering' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Offering Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-primary">₵{Number(reportData.summary.totalOfferings || 0).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Total Offerings</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">₵{Number(reportData.summary.averageOffering || 0).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Average Offering</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-orange-600">₵{Number(reportData.summary.highestOffering || 0).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Highest Offering</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">₵{Number(reportData.summary.lowestOffering || 0).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Lowest Offering</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold mb-3">Offering Details</h3>
                          {reportData.data.map((row: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="font-medium">{row.cellName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {row.attendees} attendees • ₵{(row.offering || 0).toLocaleString()} offering
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="font-bold text-green-600">₵{row.perPerson}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {reportData && reportData.type === 'cellPerformance' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Cell Performance Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-primary">{reportData.summary.totalCells}</p>
                            <p className="text-sm text-muted-foreground">Total Cells</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{reportData.summary.activeCells}</p>
                            <p className="text-sm text-muted-foreground">Active Cells</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-orange-600">{reportData.summary.totalMembers}</p>
                            <p className="text-sm text-muted-foreground">Total Members</p>
                          </div>
                          <div className="text-center p-4 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{reportData.summary.totalMeetings}</p>
                            <p className="text-sm text-muted-foreground">Total Meetings</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold mb-3">Cell Performance Details</h3>
                          {reportData.data.map((row: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="font-medium">{row.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Leader: {row.leader} • {row.members} members
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="font-bold text-green-600">{row.meetings} meetings</p>
                                <p className="text-sm text-muted-foreground">{row.averageAttendance} avg attendance</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Cell Dialog */}
      <Dialog open={showAddCellDialog} onOpenChange={setShowAddCellDialog}>
      <DialogContent className="w-96 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Cell</DialogTitle>
            <DialogDescription>
              Create a new cell in your area
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveCell();
          }}>
            <div className="space-y-4">
              <div>
                <Label>Cell Name</Label>
                <Input 
                  type="text" 
                  value={cellFormData.name} 
                  onChange={(e) => setCellFormData({ ...cellFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Leader Name</Label>
                <Input 
                  type="text" 
                  value={cellFormData.leaderName} 
                  onChange={(e) => setCellFormData({ ...cellFormData, leaderName: e.target.value })}
                />
              </div>
              <div>
                <Label>Leader Email</Label>
                <Input 
                  type="email" 
                  value={cellFormData.leaderEmail} 
                  onChange={(e) => setCellFormData({ ...cellFormData, leaderEmail: e.target.value })}
                />
              </div>
              <div>
                <Label>Leader Phone</Label>
                <Input 
                  type="tel" 
                  value={cellFormData.leaderPhone} 
                  onChange={(e) => setCellFormData({ ...cellFormData, leaderPhone: e.target.value })}
                />
              </div>
              <div>
                <Label>Meeting Day</Label>
                <Select 
                  value={cellFormData.meetingDay} 
                  onValueChange={(value) => setCellFormData({ ...cellFormData, meetingDay: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Meeting Time</Label>
                <Input 
                  type="time" 
                  value={cellFormData.meetingTime} 
                  onChange={(e) => setCellFormData({ ...cellFormData, meetingTime: e.target.value })}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input 
                  type="text" 
                  value={cellFormData.location} 
                  onChange={(e) => setCellFormData({ ...cellFormData, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={cellFormData.description} 
                  onChange={(e) => setCellFormData({ ...cellFormData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Zone Name</Label>
                <Input 
                  type="text" 
                  value={cellFormData.zoneName} 
                  onChange={(e) => setCellFormData({ ...cellFormData, zoneName: e.target.value })}
                />
              </div>
              <div>
                <Label>Zone Leader</Label>
                <Input 
                  type="text" 
                  value={cellFormData.zoneLeader} 
                  onChange={(e) => setCellFormData({ ...cellFormData, zoneLeader: e.target.value })}
                />
              </div>
              <div>
                <Label>District Name</Label>
                <Input 
                  type="text" 
                  value={cellFormData.districtName} 
                  onChange={(e) => setCellFormData({ ...cellFormData, districtName: e.target.value })}
                />
              </div>
              <div>
                <Label>District Leader</Label>
                <Input 
                  type="text" 
                  value={cellFormData.districtLeader} 
                  onChange={(e) => setCellFormData({ ...cellFormData, districtLeader: e.target.value })}
                />
              </div>
              <div>
                <Label>District Pastor</Label>
                <Input 
                  type="text" 
                  value={cellFormData.districtPastor} 
                  onChange={(e) => setCellFormData({ ...cellFormData, districtPastor: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={cellFormData.status} 
                  onValueChange={(value) => setCellFormData({ ...cellFormData, status: value })}
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
              <Button variant="outline" onClick={() => setShowAddCellDialog(false)}>Cancel</Button>
              <Button type="submit">Add Cell</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Cell Dialog */}
      <Dialog open={showEditCellDialog} onOpenChange={setShowEditCellDialog}>
      <DialogContent className="w-96 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Cell</DialogTitle>
            <DialogDescription>
              Update the details of this cell
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveCell();
          }}>
            <div className="space-y-4">
              <div>
                <Label>Cell Name</Label>
                <Input 
                  type="text" 
                  value={cellFormData.name} 
                  onChange={(e) => setCellFormData({ ...cellFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Leader Name</Label>
                <Input 
                  type="text" 
                  value={cellFormData.leaderName} 
                  onChange={(e) => setCellFormData({ ...cellFormData, leaderName: e.target.value })}
                />
              </div>
              <div>
                <Label>Leader Email</Label>
                <Input 
                  type="email" 
                  value={cellFormData.leaderEmail} 
                  onChange={(e) => setCellFormData({ ...cellFormData, leaderEmail: e.target.value })}
                />
              </div>
              <div>
                <Label>Leader Phone</Label>
                <Input 
                  type="tel" 
                  value={cellFormData.leaderPhone} 
                  onChange={(e) => setCellFormData({ ...cellFormData, leaderPhone: e.target.value })}
                />
              </div>
              <div>
                <Label>Meeting Day</Label>
                <Select 
                  value={cellFormData.meetingDay} 
                  onValueChange={(value) => setCellFormData({ ...cellFormData, meetingDay: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Meeting Time</Label>
                <Input 
                  type="time" 
                  value={cellFormData.meetingTime} 
                  onChange={(e) => setCellFormData({ ...cellFormData, meetingTime: e.target.value })}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input 
                  type="text" 
                  value={cellFormData.location} 
                  onChange={(e) => setCellFormData({ ...cellFormData, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={cellFormData.description} 
                  onChange={(e) => setCellFormData({ ...cellFormData, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Zone Name</Label>
                <Input 
                  type="text" 
                  value={cellFormData.zoneName} 
                  onChange={(e) => setCellFormData({ ...cellFormData, zoneName: e.target.value })}
                />
              </div>
              <div>
                <Label>Zone Leader</Label>
                <Input 
                  type="text" 
                  value={cellFormData.zoneLeader} 
                  onChange={(e) => setCellFormData({ ...cellFormData, zoneLeader: e.target.value })}
                />
              </div>
              <div>
                <Label>District Name</Label>
                <Input 
                  type="text" 
                  value={cellFormData.districtName} 
                  onChange={(e) => setCellFormData({ ...cellFormData, districtName: e.target.value })}
                />
              </div>
              <div>
                <Label>District Leader</Label>
                <Input 
                  type="text" 
                  value={cellFormData.districtLeader} 
                  onChange={(e) => setCellFormData({ ...cellFormData, districtLeader: e.target.value })}
                />
              </div>
              <div>
                <Label>District Pastor</Label>
                <Input 
                  type="text" 
                  value={cellFormData.districtPastor} 
                  onChange={(e) => setCellFormData({ ...cellFormData, districtPastor: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={cellFormData.status} 
                  onValueChange={(value) => setCellFormData({ ...cellFormData, status: value })}
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
              <Button variant="outline" onClick={() => setShowEditCellDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveCell}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog (for newly provisioned Cell Leader) */}
      <Dialog open={showCredsDialog} onOpenChange={setShowCredsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Login Credentials</DialogTitle>
            <DialogDescription>Share these with the new cell leader.</DialogDescription>
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
        availableZones={currentArea ? [{ id: currentArea.zoneId, name: currentArea.zoneName || 'Zone' }] : []}
        availableAreas={currentArea ? [{ id: currentArea.id, name: currentArea.name, zoneId: currentArea.zoneId }] : []}
        preselectedZoneId={currentArea?.zoneId}
        preselectedAreaId={currentArea?.id}
      />
    </div>
  );
};

export default AreaLeaderDashboard;