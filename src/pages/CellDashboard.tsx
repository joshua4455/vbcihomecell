import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { MemberManagement } from "@/components/MemberManagement";
import { MeetingForm } from "@/components/MeetingForm";
import AlertNotifications from "@/components/AlertNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  LogOut,
  ArrowLeft,
  Download,
  FileText,
  PieChart,
  Activity
} from "lucide-react";
import { Logo } from "@/components/Logo";

const CellDashboard = () => {
  const { user, logout } = useAuth();
  const { cells, meetings, areas, members, users, isLoading } = useData();
  const navigate = useNavigate();
  
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  // Find the cell assigned to the current user
  // Primary: by user.cell_id
  // Fallback: by cell.leader_id === user.id (covers cases where profile wasn't updated but cell is linked)
  const currentCell: any =
    cells.find((cell: any) => cell.id === (user as any)?.cell_id) ||
    cells.find((cell: any) => (cell as any).leader_id === (user as any)?.id);

  const currentArea: any =
    areas.find((area: any) => area.id === (user as any)?.area_id) ||
    areas.find((a: any) => a.id === currentCell?.area_id);
  
  // Get meetings for this cell
  const cellMeetings: any[] = meetings.filter((meeting: any) => meeting.cell_id === currentCell?.id);

  // Calculate cell statistics
  const totalMembers = currentCell ? members.filter((m: any) => m.cell_id === currentCell.id).length : 0;
  const activeMembers = currentCell ? members.filter((m: any) => m.cell_id === currentCell.id && m.status === 'active').length : 0;
  const totalMeetings = cellMeetings.length;
  const totalOfferings = cellMeetings.reduce((sum: number, meeting: any) => sum + (meeting.offering_amount || 0), 0);
  const averageAttendance = totalMeetings > 0 
    ? Math.round(cellMeetings.reduce((sum: number, meeting: any) => sum + (meeting.attendance_count || 0), 0) / totalMeetings)
    : 0;
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Report generation functions
  const generateAttendanceReport = () => {
    const attendanceData = cellMeetings.map((meeting: any) => ({
      date: new Date(meeting.date).toLocaleDateString(),
      attendees: meeting.attendance_count || 0,
      totalMembers: totalMembers,
      percentage: totalMembers > 0 ? Math.round(((meeting.attendance_count || 0) / totalMembers) * 100) : 0
    }));

    const report = {
      type: 'attendance',
      title: 'Attendance Report',
      cellName: currentCell?.name || 'Unknown Cell',
      period: 'All Time',
      data: attendanceData,
      summary: {
        totalMeetings,
        averageAttendance,
        totalMembers,
        bestAttendance: Math.max(...attendanceData.map(d => d.attendees)),
        worstAttendance: Math.min(...attendanceData.map(d => d.attendees))
      }
    };

    setReportData(report);
    setSelectedReport('attendance');
  };

  const generateGrowthReport = () => {
    // Helper to compute Monday-start week label and key
    const getWeekInfo = (d: Date) => {
      const date = new Date(d);
      const day = (date.getDay() + 6) % 7; // Monday=0
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const label = `Week of ${date.toLocaleDateString()}`;
      return { key, label };
    };

    const weekly: Record<string, { week: string; meetings: number; attendees: number; offerings: number; newMembers: number; visitors: number; converts: number; followups: number; visits: number }> = {};

    // Aggregate meetings by week
    for (const meeting of cellMeetings as any[]) {
      const info = getWeekInfo(new Date((meeting as any).date));
      if (!weekly[info.key]) weekly[info.key] = { week: info.label, meetings: 0, attendees: 0, offerings: 0, newMembers: 0, visitors: 0, converts: 0, followups: 0, visits: 0 };
      weekly[info.key].meetings += 1;
      weekly[info.key].attendees += ((meeting as any).attendance_count || 0);
      weekly[info.key].offerings += ((meeting as any).offering_amount || 0);
      weekly[info.key].visitors += ((meeting as any).visitors_count || 0);
      weekly[info.key].converts += ((meeting as any).converts_count || 0);
      weekly[info.key].followups += ((meeting as any).followups_count || 0);
      weekly[info.key].visits += ((meeting as any).visits_count || 0);
    }

    // Count new members per week for this cell
    const cellMemberRows = currentCell ? (members as any[]).filter((m: any) => (m as any).cell_id === currentCell.id) : [];
    for (const m of cellMemberRows as any[]) {
      const joined = (m as any).date_joined;
      if (!joined) continue;
      const info = getWeekInfo(new Date(joined));
      if (!weekly[info.key]) weekly[info.key] = { week: info.label, meetings: 0, attendees: 0, offerings: 0, newMembers: 0, visitors: 0, converts: 0, followups: 0, visits: 0 };
      weekly[info.key].newMembers += 1;
    }

    const report = {
      type: 'growth',
      title: 'Growth Report',
      cellName: currentCell?.name || 'Unknown Cell',
      period: 'Weekly Breakdown',
      data: Object.keys(weekly).sort().map((key) => weekly[key]),
      summary: {
        totalGrowth: Object.values(weekly).reduce((sum, w) => sum + (w.newMembers || 0), 0),
        averageAttendance: totalMeetings > 0 ? Math.round(cellMeetings.reduce((s, m: any) => s + (m.attendance_count || 0), 0) / totalMeetings) : 0,
        totalMembers,
        totalVisitors: Object.values(weekly).reduce((s, w) => s + (w.visitors || 0), 0),
        totalConverts: Object.values(weekly).reduce((s, w) => s + (w.converts || 0), 0),
        totalFollowups: Object.values(weekly).reduce((s, w) => s + (w.followups || 0), 0),
        totalVisits: Object.values(weekly).reduce((s, w) => s + (w.visits || 0), 0),
      }
    };

    setReportData(report);
    setSelectedReport('growth');
  };

  const generateOfferingReport = () => {
    const offeringData = cellMeetings.map((meeting: any) => ({
      date: new Date(meeting.date).toLocaleDateString(),
      offering: meeting.offering_amount || 0,
      attendees: meeting.attendance_count || 0,
      perPerson: (meeting.attendance_count || 0) > 0 ? Math.round((meeting.offering_amount || 0) / (meeting.attendance_count || 0)) : 0
    }));

    const report = {
      type: 'offering',
      title: 'Offering Report',
      cellName: currentCell?.name || 'Unknown Cell',
      period: 'All Time',
      data: offeringData,
      summary: {
        totalOfferings,
        averageOffering: totalMeetings > 0 ? Math.round(totalOfferings / totalMeetings) : 0,
        highestOffering: Math.max(...offeringData.map(d => d.offering)),
        lowestOffering: Math.min(...offeringData.map(d => d.offering)),
        averagePerPerson: totalMeetings > 0 ? Math.round(totalOfferings / (offeringData.reduce((sum, d) => sum + d.attendees, 0) || 1)) : 0
      }
    };

    setReportData(report);
    setSelectedReport('offering');
  };

  const generateMemberReport = () => {
    const cellMemberRows = currentCell ? members.filter((m: any) => m.cell_id === currentCell.id) : [];
    const memberData = cellMemberRows.map((member: any) => {
      const attendedCount = cellMeetings.reduce((sum: number, m: any) => {
        const ids = (m as any).attendees as string[] | undefined;
        const hasArray = Array.isArray(ids);
        const attendanceCount = (m as any).attendance_count || 0;
        const allAttended = !hasArray && totalMembers > 0 && attendanceCount === totalMembers;
        const attended = hasArray ? ids!.includes(member.id) : allAttended;
        return sum + (attended ? 1 : 0);
      }, 0);
      return {
        name: member.name,
        status: member.status === 'active' ? 'Active' : 'Inactive',
        phone: member.phone || '',
        joinDate: member.date_joined ? new Date(member.date_joined).toLocaleDateString() : 'Unknown',
        attendance: attendedCount,
        attendanceRate: totalMeetings > 0 ? Math.round((attendedCount / totalMeetings) * 100) : 0,
      };
    });

    const report = {
      type: 'member',
      title: 'Member Report',
      cellName: currentCell?.name || 'Unknown Cell',
      period: 'Current Status',
      data: memberData,
      summary: {
        totalMembers,
        activeMembers,
        inactiveMembers: totalMembers - activeMembers,
        averageAttendanceRate: memberData.length > 0 ? Math.round(memberData.reduce((sum, m) => sum + m.attendanceRate, 0) / memberData.length) : 0
      }
    };

    setReportData(report);
    setSelectedReport('member');
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const csvContent = generateCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a') as HTMLAnchorElement;
    a.href = url;
    a.download = `${reportData.title.replace(/\s+/g, '_')}_${currentCell?.name || 'Cell'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (data: any) => {
    if (data.type === 'attendance') {
      const headers = ['Date', 'Attendees', 'Total Members', 'Attendance %'];
      const rows = data.data.map((row: any) => [row.date, row.attendees, row.totalMembers, row.percentage + '%']);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (data.type === 'growth') {
      const headers = ['Week', 'Meetings', 'Attendees', 'Offerings', 'New Members', 'Visitors', 'Converts', 'Follow-ups', 'Visits'];
      const rows = data.data.map((row: any) => [row.week, row.meetings, row.attendees, row.offerings, row.newMembers || 0, row.visitors || 0, row.converts || 0, row.followups || 0, row.visits || 0]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (data.type === 'offering') {
      const headers = ['Date', 'Offering', 'Attendees', 'Per Person'];
      const rows = data.data.map((row: any) => [row.date, row.offering, row.attendees, row.perPerson]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (data.type === 'member') {
      const headers = ['Name', 'Status', 'Phone', 'Join Date', 'Meetings Attended', 'Attendance Rate %'];
      const rows = data.data.map((row: any) => [row.name, row.status, row.phone, row.joinDate, row.attendance, row.attendanceRate + '%']);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    return '';
  };

  const closeReport = () => {
    setSelectedReport(null);
    setReportData(null);
  };

  // Avoid showing "No Cell Assigned" while data is still loading
  if (isLoading) {
  return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <Logo className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Loading your cell...</h1>
            <p className="text-muted-foreground mb-4">
              Please wait while we load your assignment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCell) {
  return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <Logo className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">No Cell Assigned</h1>
            <p className="text-muted-foreground mb-4">
              You don't have a cell assigned yet. Please contact your area leader.
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
              {currentCell.name} Dashboard
            </h1>
            <p className="text-muted-foreground">
              Area: {currentArea?.name || 'Unknown Area'} • Cell Leader: {user?.name}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
      </div>

        {/* Alert Notifications */}
        <div className="mb-8">
        <AlertNotifications userRole="cell-leader" />
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold text-foreground">{totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Members</p>
                  <p className="text-2xl font-bold text-foreground">{activeMembers}</p>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="record-meeting">Record Meeting</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
                <CardTitle>Cell Information</CardTitle>
            <CardDescription>
                  Basic information about your home cell
            </CardDescription>
          </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Meeting Day</p>
                    <p className="font-medium text-foreground">{currentCell.meeting_day}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Meeting Time</p>
                    <p className="font-medium text-foreground">{currentCell.meeting_time}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={currentCell.status === 'active' ? 'default' : 'secondary'}>
                      {currentCell.status}
                    </Badge>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium text-foreground">{new Date(currentCell.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Average Attendance</p>
                    <p className="font-medium text-foreground">{averageAttendance}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Average Offering</p>
                    <p className="font-medium text-foreground">
                      ₵{totalMeetings > 0 ? Math.round(totalOfferings / totalMeetings) : 0}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Cell Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Area Name</p>
                      <p className="font-medium text-foreground">{currentArea?.name || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">District Name</p>
                      <p className="font-medium text-foreground">{currentArea?.district_name || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Home Leader</p>
                      <p className="font-medium text-foreground">{(currentCell as any).homeLeaderName || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">Area Leader</p>
                      <p className="font-medium text-foreground">{users.find((u: any) => u.id === (currentArea as any)?.leader_id)?.name || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">District Leader</p>
                      <p className="font-medium text-foreground">{(currentArea as any)?.district_leader || '—'}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground">District Pastor</p>
                      <p className="font-medium text-foreground">{(currentArea as any)?.district_pastor || '—'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <MemberManagement cellId={currentCell.id} />
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Meeting History</CardTitle>
                    <CardDescription>
                      View all recorded meetings for this cell
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {cellMeetings.length > 0 ? (
                  <div className="space-y-3">
                    {cellMeetings.map((meeting) => (
                      <div key={meeting.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
                          <p className="font-medium">{new Date(meeting.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {(meeting.attendance_count || 0)} attendees
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
                      Start by recording your first meeting
                    </p>
            </div>
                )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="record-meeting" className="space-y-4">
        <Card>
          <CardHeader>
                <CardTitle>Record New Meeting</CardTitle>
            <CardDescription>
                  Record attendance, offerings, and other meeting details
            </CardDescription>
          </CardHeader>
          <CardContent>
                <MeetingForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {!selectedReport ? (
              <Card>
                <CardHeader>
                  <CardTitle>Cell Reports</CardTitle>
                  <CardDescription>
                    Generate and view reports for your cell
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                      onClick={generateAttendanceReport}
                    >
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm font-medium">Attendance Report</p>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                      onClick={generateGrowthReport}
                    >
                      <div className="text-center">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm font-medium">Growth Report</p>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                      onClick={generateOfferingReport}
                    >
                      <div className="text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm font-medium">Offering Report</p>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 hover:bg-primary/5 hover:border-primary/20 transition-colors"
                      onClick={generateMemberReport}
                    >
                      <div className="text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm font-medium">Member Report</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{reportData?.title}</CardTitle>
                      <CardDescription>
                        {reportData?.cellName} • {reportData?.period}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={exportReport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={closeReport}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Reports
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reportData?.type === 'attendance' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{reportData.summary.totalMeetings}</p>
                          <p className="text-sm text-muted-foreground">Total Meetings</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{reportData.summary.averageAttendance}</p>
                          <p className="text-sm text-muted-foreground">Avg Attendance</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{reportData.summary.bestAttendance}</p>
                          <p className="text-sm text-muted-foreground">Best Attendance</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{reportData.summary.worstAttendance}</p>
                          <p className="text-sm text-muted-foreground">Lowest Attendance</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Meeting Details</h3>
                        {reportData.data.map((meeting: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{meeting.date}</p>
                              <p className="text-sm text-muted-foreground">
                                {meeting.attendees} attendees
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{meeting.percentage}%</p>
                              <p className="text-sm text-muted-foreground">
                                {meeting.attendees}/{meeting.totalMembers}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reportData?.type === 'growth' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{reportData.summary.totalGrowth}</p>
                          <p className="text-sm text-muted-foreground">Total Growth</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{reportData.summary.averageAttendance}</p>
                          <p className="text-sm text-muted-foreground">Avg Attendance</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{reportData.summary.totalMembers}</p>
                          <p className="text-sm text-muted-foreground">Total Members</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <h3 className="text-lg font-semibold">Weekly Breakdown</h3>
                        {reportData.data.map((row: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{row.week}</p>
                              <p className="text-sm text-muted-foreground">
                                {row.meetings} meetings
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-bold text-primary">{row.attendees} attendees</p>
                              <p className="text-sm text-muted-foreground">
                                ₵{(row.offerings || 0).toLocaleString()} • {row.newMembers || 0} new members
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reportData?.type === 'offering' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">₵{reportData.summary.totalOfferings.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Total Offerings</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">₵{reportData.summary.averageOffering.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Avg per Meeting</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">₵{reportData.summary.highestOffering.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Highest Offering</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">₵{reportData.summary.averagePerPerson.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Avg per Person</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Meeting Details</h3>
                        {reportData.data.map((meeting: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{meeting.date}</p>
                              <p className="text-sm text-muted-foreground">
                                {meeting.attendees} attendees
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-bold text-green-600">₵{meeting.offering.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">
                                ₵{meeting.perPerson} per person
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reportData?.type === 'member' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{reportData.summary.totalMembers}</p>
                          <p className="text-sm text-muted-foreground">Total Members</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{reportData.summary.activeMembers}</p>
                          <p className="text-sm text-muted-foreground">Active Members</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">{reportData.summary.inactiveMembers}</p>
                          <p className="text-sm text-muted-foreground">Inactive Members</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{reportData.summary.averageAttendanceRate}%</p>
                          <p className="text-sm text-muted-foreground">Avg Attendance Rate</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Member Details</h3>
                        {reportData.data.map((member: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {member.phone} • Joined: {member.joinDate}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                                {member.status}
                              </Badge>
                              <p className="text-sm text-muted-foreground">
                                {member.attendance} meetings • {member.attendanceRate}%
                              </p>
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
    </div>
  );
};

export default CellDashboard;