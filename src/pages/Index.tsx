import { useState } from "react";
import { Users, MapPin, Calendar, TrendingUp, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoneCard } from "@/components/ZoneCard";
import { Navigation } from "@/components/Navigation";
import { MeetingForm } from "@/components/MeetingForm";
import { StatsCard } from "@/components/StatsCard";

// Mock data for zones
const zones = [
  { id: 1, name: "Zone Alpha", leader: "Pastor John Doe", cells: 12, members: 145, attendance: 87 },
  { id: 2, name: "Zone Beta", leader: "Pastor Mary Smith", cells: 10, members: 128, attendance: 92 },
  { id: 3, name: "Zone Gamma", leader: "Pastor David Wilson", cells: 15, members: 178, attendance: 85 },
  { id: 4, name: "Zone Delta", leader: "Pastor Sarah Brown", cells: 8, members: 98, attendance: 94 },
  { id: 5, name: "Zone Epsilon", leader: "Pastor Michael Johnson", cells: 11, members: 134, attendance: 89 },
  { id: 6, name: "Zone Zeta", leader: "Pastor Lisa Anderson", cells: 9, members: 112, attendance: 91 },
  { id: 7, name: "Zone Eta", leader: "Pastor Robert Taylor", cells: 13, members: 156, attendance: 83 },
  { id: 8, name: "Zone Theta", leader: "Pastor Jennifer Davis", cells: 14, members: 167, attendance: 88 }
];

const Index = () => {
  const [view, setView] = useState<"dashboard" | "form">("dashboard");
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  const totalMembers = zones.reduce((sum, zone) => sum + zone.members, 0);
  const totalCells = zones.reduce((sum, zone) => sum + zone.cells, 0);
  const averageAttendance = Math.round(zones.reduce((sum, zone) => sum + zone.attendance, 0) / zones.length);
  const totalOfferings = 12450; // Mock data

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {view === "dashboard" ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-primary mb-2">
                Priesthood Management Platform
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your home cells, track attendance, and monitor spiritual growth across all zones
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Members"
                value={totalMembers.toString()}
                icon={Users}
                trend="+5.2%"
                trendUp={true}
              />
              <StatsCard
                title="Active Cells"
                value={totalCells.toString()}
                icon={MapPin}
                trend="+2.1%"
                trendUp={true}
              />
              <StatsCard
                title="Avg Attendance"
                value={`${averageAttendance}%`}
                icon={Calendar}
                trend="+3.4%"
                trendUp={true}
              />
              <StatsCard
                title="Weekly Offerings"
                value={`$${totalOfferings.toLocaleString()}`}
                icon={TrendingUp}
                trend="+8.7%"
                trendUp={true}
              />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="default" 
                  size="lg"
                  onClick={() => setView("form")}
                  className="bg-gradient-primary"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Record Meeting
                </Button>
                <Button variant="outline" size="lg">
                  <Calendar className="mr-2 h-5 w-5" />
                  View Reports
                </Button>
                <Button variant="outline" size="lg">
                  <Users className="mr-2 h-5 w-5" />
                  Manage Members
                </Button>
              </div>
            </div>

            {/* Zones Grid */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-primary">Zone Overview</h2>
                <Badge variant="secondary" className="text-sm">
                  {zones.length} Active Zones
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {zones.map((zone) => (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    onClick={() => setSelectedZone(zone.id)}
                    isSelected={selectedZone === zone.id}
                  />
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <Card className="shadow-elevation">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Calendar className="mr-2 h-5 w-5" />
                  Recent Meeting Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { zone: "Zone Alpha", cell: "Cell A-1", time: "2 hours ago", attendance: 12 },
                    { zone: "Zone Beta", cell: "Cell B-3", time: "4 hours ago", attendance: 8 },
                    { zone: "Zone Gamma", cell: "Cell G-2", time: "6 hours ago", attendance: 15 },
                    { zone: "Zone Delta", cell: "Cell D-1", time: "1 day ago", attendance: 10 }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-foreground">{activity.zone} - {activity.cell}</p>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                      <Badge variant="outline">{activity.attendance} attended</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setView("dashboard")}
                className="mb-4"
              >
                ← Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-primary">Record Cell Meeting</h1>
              <p className="text-muted-foreground">Enter the details of your cell meeting</p>
            </div>
            <MeetingForm />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;