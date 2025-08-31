import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "@/components/Navigation";
import { Users, MapPin, Calendar, TrendingUp, Plus, Eye } from "lucide-react";

const ZoneLeaderDashboard = () => {
  // Mock data for zones and cells
  const myZones = [
    {
      id: 1,
      name: "North Zone",
      leader: "John Smith",
      cells: 8,
      members: 156,
      attendance: 85,
      lastMeeting: "2024-01-28"
    },
    {
      id: 2,
      name: "Central Zone", 
      leader: "Mary Johnson",
      cells: 6,
      members: 124,
      attendance: 78,
      lastMeeting: "2024-01-27"
    }
  ];

  const homeCells = [
    {
      id: 1,
      name: "Victory Cell",
      leader: "Sarah Wilson",
      zone: "North Zone",
      members: 18,
      lastAttendance: 16,
      meetingDay: "Friday",
      status: "active"
    },
    {
      id: 2,
      name: "Grace Cell",
      leader: "Michael Brown", 
      zone: "North Zone",
      members: 22,
      lastAttendance: 19,
      meetingDay: "Thursday",
      status: "active"
    },
    {
      id: 3,
      name: "Faith Cell",
      leader: "Lisa Davis",
      zone: "Central Zone", 
      members: 15,
      lastAttendance: 12,
      meetingDay: "Wednesday",
      status: "active"
    },
    {
      id: 4,
      name: "Hope Cell",
      leader: "David Miller",
      zone: "Central Zone",
      members: 20,
      lastAttendance: 0,
      meetingDay: "Saturday",
      status: "inactive"
    }
  ];

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Zone Leader Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your zones and home cells</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Cell
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Zones</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myZones.length}</div>
              <p className="text-xs text-muted-foreground">Under your leadership</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Cells</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{homeCells.length}</div>
              <p className="text-xs text-muted-foreground">Active home cells</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myZones.reduce((acc, zone) => acc + zone.members, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all zones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(myZones.reduce((acc, zone) => acc + zone.attendance, 0) / myZones.length)}%
              </div>
              <p className="text-xs text-muted-foreground">Last month average</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="zones" className="space-y-6">
          <TabsList>
            <TabsTrigger value="zones">My Zones</TabsTrigger>
            <TabsTrigger value="cells">Home Cells</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="zones" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myZones.map((zone) => (
                <Card key={zone.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{zone.name}</CardTitle>
                      <Badge variant="outline" className={getAttendanceColor(zone.attendance)}>
                        {zone.attendance}% attendance
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Zone Leader</p>
                        <p className="font-medium">{zone.leader}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Meeting</p>
                        <p className="font-medium">{zone.lastMeeting}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Home Cells</p>
                        <p className="font-medium">{zone.cells} cells</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Members</p>
                        <p className="font-medium">{zone.members} members</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Zone Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cells" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {homeCells.map((cell) => (
                <Card key={cell.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{cell.name}</h3>
                        <p className="text-sm text-muted-foreground">{cell.zone}</p>
                      </div>
                      <Badge className={getStatusColor(cell.status)}>
                        {cell.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Cell Leader</p>
                        <p className="font-medium">{cell.leader}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Meeting Day</p>
                        <p className="font-medium">{cell.meetingDay}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Members</p>
                        <p className="font-medium">{cell.members}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Attendance</p>
                        <p className="font-medium">{cell.lastAttendance}/{cell.members}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Meeting
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Zone Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myZones.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between">
                        <span className="font-medium">{zone.name}</span>
                        <Badge variant="outline" className={getAttendanceColor(zone.attendance)}>
                          {zone.attendance}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cell Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Active Cells</span>
                      <Badge className="bg-green-100 text-green-800">
                        {homeCells.filter(cell => cell.status === "active").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Inactive Cells</span>
                      <Badge className="bg-red-100 text-red-800">
                        {homeCells.filter(cell => cell.status === "inactive").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Members</span>
                      <Badge variant="outline">
                        {homeCells.reduce((acc, cell) => acc + cell.members, 0)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ZoneLeaderDashboard;