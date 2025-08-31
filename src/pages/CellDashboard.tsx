import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Church, Users, Calendar, LogOut, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AlertNotifications from "@/components/AlertNotifications";

const CellDashboard = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    navigate("/login");
  };

  const cellData = {
    cellName: "Victory Cell 1",
    zone: "Zone A",
    leaderName: "Pastor John Smith",
    totalMembers: 15,
    lastMeetingAttendance: 12,
    thisWeekOffering: 2500,
    recentMeetings: [
      { date: "2024-01-28", attendance: 12, offering: 2500 },
      { date: "2024-01-21", attendance: 10, offering: 1800 },
      { date: "2024-01-14", attendance: 14, offering: 3200 },
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Church className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{cellData.cellName}</h1>
                <p className="text-sm text-muted-foreground">{cellData.zone} • {cellData.leaderName}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Alert Notifications */}
        <AlertNotifications userRole="cell-leader" />
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold text-foreground">{cellData.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Attendance</p>
                  <p className="text-2xl font-bold text-foreground">{cellData.lastMeetingAttendance}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((cellData.lastMeetingAttendance / cellData.totalMembers) * 100)}% present
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {Math.round((cellData.lastMeetingAttendance / cellData.totalMembers) * 100)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week Offering</p>
                  <p className="text-2xl font-bold text-foreground">₦{cellData.thisWeekOffering.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    Weekly
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Meeting Management
            </CardTitle>
            <CardDescription>
              Record attendance and meeting details for your cell
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/meeting-form">
              <Button size="lg" className="w-full">
                <Plus className="h-5 w-5 mr-2" />
                Record New Meeting
              </Button>
            </Link>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Recent Meetings</h4>
              <div className="space-y-2">
                {cellData.recentMeetings.map((meeting, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{meeting.date}</p>
                      <p className="text-xs text-muted-foreground">{meeting.attendance} members attended</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">₦{meeting.offering.toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs">
                        {Math.round((meeting.attendance / cellData.totalMembers) * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cell Members Quick View */}
        <Card>
          <CardHeader>
            <CardTitle>Cell Members</CardTitle>
            <CardDescription>
              {cellData.totalMembers} registered members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "John Doe", "Mary Johnson", "David Wilson", "Sarah Brown", 
                "Michael Davis", "Lisa Anderson", "James Wilson", "Emma Taylor",
                "Robert Jones", "Anna Garcia", "William Miller", "Olivia Davis",
                "Benjamin Moore", "Sophia Jackson", "Lucas White"
              ].map((name, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 rounded-md bg-accent/30">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm text-foreground">{name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CellDashboard;