import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Report, Meeting } from "@/lib/types";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Download,
  FileText,
  PieChart,
  Activity
} from "lucide-react";

interface ReportsAnalyticsProps {
  areaId?: string;
  cellId?: string;
}

export const ReportsAnalytics = ({ areaId, cellId }: ReportsAnalyticsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<"weekly" | "monthly" | "quarterly">("monthly");
  const [selectedReportType, setSelectedReportType] = useState<string>("attendance");
  
  const { user } = useAuth();
  const { meetings, areas, cells, generateReport } = useData();
  
  // Filter meetings based on context
  const relevantMeetings = meetings.filter(meeting => {
    if (cellId) return meeting.cellId === cellId;
    if (areaId) return meeting.areaId === areaId;
    return true;
  });

  // Calculate key metrics
  const totalMeetings = relevantMeetings.length;
  const totalAttendance = relevantMeetings.reduce((sum, m) => sum + m.attendees.length, 0);
  const totalOfferings = relevantMeetings.reduce((sum, m) => sum + m.offering, 0);
  const totalVisitors = relevantMeetings.reduce((sum, m) => sum + m.newVisitors.length, 0);
  const totalConverts = relevantMeetings.reduce((sum, m) => 
    sum + m.newVisitors.filter(v => v.isConvert).length, 0
  );

  const averageAttendance = totalMeetings > 0 ? Math.round(totalAttendance / totalMeetings) : 0;
  const averageOffering = totalMeetings > 0 ? Math.round(totalOfferings / totalMeetings) : 0;

  // Generate attendance trend data
  const getAttendanceTrend = () => {
    const last4Meetings = relevantMeetings
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
      .reverse();

    return last4Meetings.map(meeting => ({
      date: new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      attendance: meeting.attendees.length,
      offering: meeting.offering
    }));
  };

  // Generate area comparison data
  const getAreaComparison = () => {
    if (areaId) return []; // Don't show area comparison if viewing specific area
    
    return areas.map(area => {
      const areaMeetings = meetings.filter(m => m.areaId === area.id);
      const areaAttendance = areaMeetings.reduce((sum, m) => sum + m.attendees.length, 0);
      const areaOfferings = areaMeetings.reduce((sum, m) => sum + m.offering, 0);
      
      return {
        name: area.name,
        meetings: areaMeetings.length,
        attendance: areaAttendance,
        offerings: areaOfferings,
        averageAttendance: areaMeetings.length > 0 ? Math.round(areaAttendance / areaMeetings.length) : 0
      };
    });
  };

  const handleGenerateReport = () => {
    const report = generateReport(selectedPeriod, areaId, cellId);
    // In a real app, this would trigger download or display detailed report
    console.log('Generated report:', report);
  };

  const exportToCSV = () => {
    // Simple CSV export functionality
    const headers = ['Date', 'Attendance', 'Offering', 'New Visitors', 'Visits Made'];
    const csvData = relevantMeetings.map(meeting => [
      new Date(meeting.date).toLocaleDateString(),
      meeting.attendees.length,
      meeting.offering,
      meeting.newVisitors.length,
      meeting.visitsCount
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPeriod}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports & Analytics</h2>
          <p className="text-muted-foreground">
            Generate insights and track performance metrics
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "weekly" | "monthly" | "quarterly")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleGenerateReport}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Meetings</p>
                <p className="text-2xl font-bold text-foreground">{totalMeetings}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold text-foreground">{averageAttendance}</p>
                <p className="text-xs text-muted-foreground">per meeting</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Offering</p>
                <p className="text-2xl font-bold text-foreground">₵{averageOffering.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">per meeting</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Visitors</p>
                <p className="text-2xl font-bold text-foreground">{totalVisitors}</p>
                <p className="text-xs text-muted-foreground">{totalConverts} converts</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance">Attendance Trends</TabsTrigger>
          <TabsTrigger value="offerings">Offerings</TabsTrigger>
          <TabsTrigger value="areas">Area Comparison</TabsTrigger>
          <TabsTrigger value="visitors">Visitor Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Attendance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getAttendanceTrend().map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{data.date}</p>
                        <p className="text-sm text-muted-foreground">Meeting {index + 1}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{data.attendance} attendees</p>
                      <p className="text-sm text-muted-foreground">₵{data.offering.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offerings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Offering Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">₵{totalOfferings.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Offerings</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">₵{averageOffering.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Average per Meeting</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Top Offering Meetings</h4>
                  {relevantMeetings
                    .sort((a, b) => b.offering - a.offering)
                    .slice(0, 3)
                    .map((meeting, index) => (
                      <div key={meeting.id} className="flex items-center justify-between p-2 rounded bg-accent/30">
                        <span className="text-sm text-foreground">
                          {new Date(meeting.date).toLocaleDateString()}
                        </span>
                        <Badge variant="outline">₵{meeting.offering.toLocaleString()}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Area Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getAreaComparison().map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">{area.name.split(' ')[1]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{area.name}</p>
                        <p className="text-sm text-muted-foreground">{area.meetings} meetings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{area.averageAttendance} avg attendance</p>
                      <p className="text-sm text-muted-foreground">₵{area.offerings.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Visitor & Conversion Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{totalVisitors}</p>
                    <p className="text-sm text-muted-foreground">Total Visitors</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{totalConverts}</p>
                    <p className="text-sm text-muted-foreground">New Converts</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Conversion Rate</h4>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${totalVisitors > 0 ? (totalConverts / totalVisitors) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {totalVisitors > 0 ? Math.round((totalConverts / totalVisitors) * 100) : 0}% conversion rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setSelectedPeriod("weekly")}>
              <Calendar className="mr-2 h-4 w-4" />
              Weekly Summary
            </Button>
            <Button variant="outline" onClick={() => setSelectedPeriod("monthly")}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Monthly Report
            </Button>
            <Button variant="outline" onClick={() => setSelectedPeriod("quarterly")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Quarterly Review
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
