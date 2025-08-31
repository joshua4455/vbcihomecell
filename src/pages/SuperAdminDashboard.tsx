import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { 
  Church, Users, TrendingUp, DollarSign, LogOut, Plus, 
  Settings, Eye, Edit, Trash2, Shield, UserCheck, Calendar,
  Bell, AlertCircle, MessageSquare, Send, X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    title: "",
    message: "",
    type: "info",
    targetAudience: "all",
    priority: "normal"
  });
  
  const handleLogout = () => {
    navigate("/login");
  };

  const systemStats = {
    totalZones: 8,
    totalCells: 45,
    totalMembers: 1247,
    totalLeaders: 53,
    thisWeekAttendance: 892,
    thisWeekOffering: 125000,
    activeUsers: 48
  };

  const zones = [
    { id: 1, name: "Zone A", cells: 6, members: 158, leader: "Pastor David Johnson", attendance: 89 },
    { id: 2, name: "Zone B", cells: 5, members: 142, leader: "Pastor Sarah Williams", attendance: 85 },
    { id: 3, name: "Zone C", cells: 7, members: 189, leader: "Pastor Michael Brown", attendance: 92 },
    { id: 4, name: "Zone D", cells: 4, members: 121, leader: "Pastor Lisa Davis", attendance: 78 },
    { id: 5, name: "Zone E", cells: 6, members: 167, leader: "Pastor James Wilson", attendance: 88 },
    { id: 6, name: "Zone F", cells: 5, members: 134, leader: "Pastor Mary Martinez", attendance: 91 },
    { id: 7, name: "Zone G", cells: 6, members: 178, leader: "Pastor Robert Garcia", attendance: 86 },
    { id: 8, name: "Zone H", cells: 6, members: 158, leader: "Pastor Jennifer Lee", attendance: 90 }
  ];

  const recentActivity = [
    { type: "meeting", zone: "Zone A", cell: "Cell 1", action: "Meeting recorded", time: "2 hours ago" },
    { type: "user", zone: "Zone C", cell: "Cell 3", action: "New cell leader assigned", time: "5 hours ago" },
    { type: "meeting", zone: "Zone B", cell: "Cell 2", action: "High attendance (95%)", time: "1 day ago" },
    { type: "system", zone: "System", cell: "", action: "Weekly report generated", time: "2 days ago" }
  ];

  const users = [
    { id: 1, name: "Pastor John Smith", role: "Zone Leader", zone: "Zone A", status: "Active", lastLogin: "2 hours ago" },
    { id: 2, name: "Sister Mary Jane", role: "Cell Leader", zone: "Zone A", status: "Active", lastLogin: "5 hours ago" },
    { id: 3, name: "Brother Paul Wilson", role: "Cell Leader", zone: "Zone B", status: "Inactive", lastLogin: "3 days ago" },
    { id: 4, name: "Pastor Sarah Brown", role: "Zone Leader", zone: "Zone C", status: "Active", lastLogin: "1 hour ago" }
  ];

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      title: "Zone Leader Meeting",
      message: "Monthly zone leader meeting scheduled for next Friday at 6 PM. Please confirm your attendance.",
      type: "info",
      targetAudience: "zone-leaders",
      priority: "high",
      createdAt: "2 hours ago",
      active: true
    },
    {
      id: 2,
      title: "Cell Reports Due",
      message: "All cell leaders must submit their monthly reports by end of week. Late submissions will be followed up.",
      type: "warning",
      targetAudience: "cell-leaders",
      priority: "normal",
      createdAt: "1 day ago",
      active: true
    },
    {
      id: 3,
      title: "System Maintenance",
      message: "The system will undergo maintenance this Sunday from 2-4 AM. Expect brief service interruptions.",
      type: "alert",
      targetAudience: "all",
      priority: "high",
      createdAt: "3 days ago",
      active: false
    }
  ]);

  const handleCreateAlert = () => {
    if (newAlert.title && newAlert.message) {
      const alert = {
        id: alerts.length + 1,
        ...newAlert,
        createdAt: "Just now",
        active: true
      };
      setAlerts([alert, ...alerts]);
      setNewAlert({ title: "", message: "", type: "info", targetAudience: "all", priority: "normal" });
      setShowAlertForm(false);
    }
  };

  const toggleAlertStatus = (id: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ));
  };

  const deleteAlert = (id: number) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Super Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Priesthood Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* System Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Zones</p>
                  <p className="text-2xl font-bold text-foreground">{systemStats.totalZones}</p>
                </div>
                <Church className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cells</p>
                  <p className="text-2xl font-bold text-foreground">{systemStats.totalCells}</p>
                </div>
                <Users className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="text-2xl font-bold text-foreground">{systemStats.totalMembers.toLocaleString()}</p>
                </div>
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leaders</p>
                  <p className="text-2xl font-bold text-foreground">{systemStats.totalLeaders}</p>
                </div>
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Attendance</p>
                  <p className="text-2xl font-bold text-foreground">{systemStats.thisWeekAttendance}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((systemStats.thisWeekAttendance / systemStats.totalMembers) * 100)}%
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Offering</p>
                  <p className="text-2xl font-bold text-foreground">₦{(systemStats.thisWeekOffering / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-foreground">{systemStats.activeUsers}</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="zones" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-fit">
            <TabsTrigger value="zones">Zones & Cells</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
            <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          {/* Zones & Cells Tab */}
          <TabsContent value="zones">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Zone Management</CardTitle>
                    <CardDescription>
                      Manage all zones, cells, and their performance metrics
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Zone
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {zones.map((zone) => (
                    <Card key={zone.id} className="bg-accent/30 border-border">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">{zone.name}</h3>
                            <Badge variant={zone.attendance >= 85 ? "default" : "secondary"}>
                              {zone.attendance}%
                            </Badge>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <p className="text-muted-foreground">{zone.leader}</p>
                            <p className="text-foreground">{zone.cells} cells • {zone.members} members</p>
                          </div>

                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage cell leaders, zone leaders, and their permissions
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-accent/30">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.role} • {user.zone}</p>
                          <p className="text-xs text-muted-foreground">Last login: {user.lastLogin}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts & Notifications Tab */}
          <TabsContent value="alerts">
            <div className="space-y-6">
              {/* Create Alert Form */}
              {showAlertForm && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Create New Alert</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAlertForm(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Alert Title</Label>
                        <Input
                          id="title"
                          placeholder="Enter alert title"
                          value={newAlert.title}
                          onChange={(e) => setNewAlert({...newAlert, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Alert Type</Label>
                        <Select 
                          value={newAlert.type} 
                          onValueChange={(value) => setNewAlert({...newAlert, type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="alert">Alert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="audience">Target Audience</Label>
                        <Select 
                          value={newAlert.targetAudience} 
                          onValueChange={(value) => setNewAlert({...newAlert, targetAudience: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="zone-leaders">Zone Leaders Only</SelectItem>
                            <SelectItem value="cell-leaders">Cell Leaders Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority Level</Label>
                        <Select 
                          value={newAlert.priority} 
                          onValueChange={(value) => setNewAlert({...newAlert, priority: value})}
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
                      <Label htmlFor="message">Alert Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Enter detailed alert message"
                        rows={4}
                        value={newAlert.message}
                        onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAlertForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAlert}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Alert
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alerts List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Bell className="h-5 w-5" />
                        <span>Alert Management</span>
                      </CardTitle>
                      <CardDescription>
                        Create and manage alerts for zone leaders and cell leaders
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowAlertForm(!showAlertForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Alert
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <Card key={alert.id} className={`${!alert.active ? 'opacity-50' : ''}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-2">
                                  {alert.type === "info" && <MessageSquare className="h-4 w-4 text-blue-500" />}
                                  {alert.type === "warning" && <AlertCircle className="h-4 w-4 text-orange-500" />}
                                  {alert.type === "alert" && <AlertCircle className="h-4 w-4 text-red-500" />}
                                  <h3 className="font-semibold text-foreground">{alert.title}</h3>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={alert.priority === "high" ? "destructive" : alert.priority === "normal" ? "default" : "secondary"}>
                                    {alert.priority}
                                  </Badge>
                                  <Badge variant="outline">
                                    {alert.targetAudience === "all" ? "All Users" : 
                                     alert.targetAudience === "zone-leaders" ? "Zone Leaders" : "Cell Leaders"}
                                  </Badge>
                                  <Badge variant={alert.active ? "default" : "secondary"}>
                                    {alert.active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{alert.message}</p>
                              <p className="text-xs text-muted-foreground">Created: {alert.createdAt}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toggleAlertStatus(alert.id)}
                              >
                                {alert.active ? "Deactivate" : "Activate"}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteAlert(alert.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports & Analytics Tab */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center text-muted-foreground py-8">
                      📊 Attendance analytics chart would go here
                      <p className="text-sm mt-2">Weekly attendance trends across all zones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Offering Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center text-muted-foreground py-8">
                      💰 Offering analytics chart would go here
                      <p className="text-sm mt-2">Weekly offering trends across all zones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Zone Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {zones.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">{zone.name.split(' ')[1]}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{zone.name}</p>
                            <p className="text-sm text-muted-foreground">{zone.cells} cells • {zone.members} members</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">{zone.attendance}% attendance</p>
                            <div className="w-20 h-2 bg-accent rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${zone.attendance}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
                <CardDescription>
                  Latest activities across all zones and cells
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border bg-accent/30">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {activity.type === "meeting" && <Calendar className="h-4 w-4 text-primary" />}
                          {activity.type === "user" && <Users className="h-4 w-4 text-primary" />}
                          {activity.type === "system" && <Settings className="h-4 w-4 text-primary" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.zone}{activity.cell && ` • ${activity.cell}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;