import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Church, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const MeetingFormPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [attendees, setAttendees] = useState<number[]>([]);
  const [newVisitors, setNewVisitors] = useState([{ name: "", contact: "", notes: "" }]);
  const [formData, setFormData] = useState({
    zone: "",
    area: "",
    zoneLeader: "",
    areaLeader: "",
    districtLeader: "",
    districtPastor: "",
    timeOpened: "",
    timeClosed: "",
    offering: "",
    visitsCount: "",
    visitNotes: "",
  });

  // Church hierarchy data
  const zones = [
    { id: "zone-a", name: "Zone A (Alpha)" },
    { id: "zone-b", name: "Zone B (Beta)" },
    { id: "zone-c", name: "Zone C (Gamma)" },
    { id: "zone-d", name: "Zone D (Delta)" },
  ];

  const areas = [
    { id: "area-1", name: "Area 1 - Central" },
    { id: "area-2", name: "Area 2 - North" },
    { id: "area-3", name: "Area 3 - South" },
    { id: "area-4", name: "Area 4 - East" },
    { id: "area-5", name: "Area 5 - West" },
  ];

  const zoneLeaders = [
    { id: "zl-1", name: "Pastor Samuel Adebayo" },
    { id: "zl-2", name: "Pastor Grace Okafor" },
    { id: "zl-3", name: "Pastor James Eze" },
    { id: "zl-4", name: "Pastor Ruth Akinola" },
  ];

  const areaLeaders = [
    { id: "al-1", name: "Elder Michael Okoro" },
    { id: "al-2", name: "Elder Faith Adamu" },
    { id: "al-3", name: "Elder Peter Nwosu" },
    { id: "al-4", name: "Elder Mary Ogundimu" },
    { id: "al-5", name: "Elder David Yakubu" },
  ];

  const districtLeaders = [
    { id: "dl-1", name: "Reverend Dr. Abraham Kalu" },
    { id: "dl-2", name: "Reverend Dr. Victoria Chukwu" },
    { id: "dl-3", name: "Reverend Dr. Joseph Bello" },
  ];

  const districtPastors = [
    { id: "dp-1", name: "Bishop Matthew Ogbonna" },
    { id: "dp-2", name: "Bishop Helen Usman" },
    { id: "dp-3", name: "Bishop Emmanuel Okafor" },
  ];

  const cellMembers = [
    { id: 1, name: "John Doe", phone: "+234 801 234 5678" },
    { id: 2, name: "Mary Johnson", phone: "+234 802 345 6789" },
    { id: 3, name: "David Wilson", phone: "+234 803 456 7890" },
    { id: 4, name: "Sarah Brown", phone: "+234 804 567 8901" },
    { id: 5, name: "Michael Davis", phone: "+234 805 678 9012" },
    { id: 6, name: "Lisa Anderson", phone: "+234 806 789 0123" },
    { id: 7, name: "James Wilson", phone: "+234 807 890 1234" },
    { id: 8, name: "Emma Taylor", phone: "+234 808 901 2345" },
    { id: 9, name: "Robert Jones", phone: "+234 809 012 3456" },
    { id: 10, name: "Anna Garcia", phone: "+234 810 123 4567" },
    { id: 11, name: "William Miller", phone: "+234 811 234 5678" },
    { id: 12, name: "Olivia Davis", phone: "+234 812 345 6789" },
    { id: 13, name: "Benjamin Moore", phone: "+234 813 456 7890" },
    { id: 14, name: "Sophia Jackson", phone: "+234 814 567 8901" },
    { id: 15, name: "Lucas White", phone: "+234 815 678 9012" }
  ];

  const handleAttendanceChange = (memberId: number, checked: boolean) => {
    if (checked) {
      setAttendees([...attendees, memberId]);
    } else {
      setAttendees(attendees.filter(id => id !== memberId));
    }
  };

  const addNewVisitor = () => {
    setNewVisitors([...newVisitors, { name: "", contact: "", notes: "" }]);
  };

  const updateVisitor = (index: number, field: string, value: string) => {
    const updated = newVisitors.map((visitor, i) => 
      i === index ? { ...visitor, [field]: value } : visitor
    );
    setNewVisitors(updated);
  };

  const removeVisitor = (index: number) => {
    setNewVisitors(newVisitors.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Meeting Record Saved",
      description: `Successfully recorded meeting with ${attendees.length} attendees and ${newVisitors.filter(v => v.name).length} new visitors.`,
    });
    navigate("/dashboard");
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Meeting record has been saved as draft.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Church className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Record Meeting</h1>
                <p className="text-sm text-muted-foreground">Victory Cell 1 • Zone A</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meeting Details */}
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Church Hierarchy Section */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                <h3 className="text-sm font-medium text-foreground">Church Hierarchy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone</Label>
                    <Select value={formData.zone} onValueChange={(value) => setFormData({...formData, zone: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="area">Area</Label>
                    <Select value={formData.area} onValueChange={(value) => setFormData({...formData, area: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Area" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zoneLeader">Zone Leader</Label>
                    <Select value={formData.zoneLeader} onValueChange={(value) => setFormData({...formData, zoneLeader: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Zone Leader" />
                      </SelectTrigger>
                      <SelectContent>
                        {zoneLeaders.map((leader) => (
                          <SelectItem key={leader.id} value={leader.id}>
                            {leader.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="areaLeader">Area Leader</Label>
                    <Select value={formData.areaLeader} onValueChange={(value) => setFormData({...formData, areaLeader: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Area Leader" />
                      </SelectTrigger>
                      <SelectContent>
                        {areaLeaders.map((leader) => (
                          <SelectItem key={leader.id} value={leader.id}>
                            {leader.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="districtLeader">District Leader</Label>
                    <Select value={formData.districtLeader} onValueChange={(value) => setFormData({...formData, districtLeader: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select District Leader" />
                      </SelectTrigger>
                      <SelectContent>
                        {districtLeaders.map((leader) => (
                          <SelectItem key={leader.id} value={leader.id}>
                            {leader.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="districtPastor">District Pastor</Label>
                    <Select value={formData.districtPastor} onValueChange={(value) => setFormData({...formData, districtPastor: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select District Pastor" />
                      </SelectTrigger>
                      <SelectContent>
                        {districtPastors.map((pastor) => (
                          <SelectItem key={pastor.id} value={pastor.id}>
                            {pastor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Meeting Times and Offering */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeOpened">Time Opened</Label>
                  <Input
                    id="timeOpened"
                    type="time"
                    value={formData.timeOpened}
                    onChange={(e) => setFormData({...formData, timeOpened: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeClosed">Time Closed</Label>
                  <Input
                    id="timeClosed"
                    type="time"
                    value={formData.timeClosed}
                    onChange={(e) => setFormData({...formData, timeClosed: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="offering">Offering Amount (₦)</Label>
                <Input
                  id="offering"
                  type="number"
                  placeholder="0.00"
                  value={formData.offering}
                  onChange={(e) => setFormData({...formData, offering: e.target.value})}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>
                Attendance ({attendees.length}/{cellMembers.length})
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Attendance Rate: {cellMembers.length > 0 ? Math.round((attendees.length / cellMembers.length) * 100) : 0}%
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cellMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-accent/30">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={attendees.includes(member.id)}
                      onCheckedChange={(checked) => 
                        handleAttendanceChange(member.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`member-${member.id}`}
                        className="text-sm font-medium text-foreground cursor-pointer"
                      >
                        {member.name}
                      </label>
                      <p className="text-xs text-muted-foreground">{member.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visitsCount">Number of Visits Made</Label>
                <Input
                  id="visitsCount"
                  type="number"
                  placeholder="0"
                  value={formData.visitsCount}
                  onChange={(e) => setFormData({...formData, visitsCount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitNotes">Visit Notes</Label>
                <Textarea
                  id="visitNotes"
                  placeholder="Describe the visits made during the week..."
                  value={formData.visitNotes}
                  onChange={(e) => setFormData({...formData, visitNotes: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* New Visitors & Converts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>New Visitors & Converts</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addNewVisitor}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Visitor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {newVisitors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No new visitors recorded for this meeting.
                </p>
              ) : (
                <div className="space-y-4">
                  {newVisitors.map((visitor, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-accent/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">Visitor {index + 1}</h4>
                        {newVisitors.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVisitor(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            placeholder="Enter visitor's name"
                            value={visitor.name}
                            onChange={(e) => updateVisitor(index, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Information</Label>
                          <Input
                            placeholder="Phone number or email"
                            value={visitor.contact}
                            onChange={(e) => updateVisitor(index, "contact", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Additional notes about the visitor..."
                          value={visitor.notes}
                          onChange={(e) => updateVisitor(index, "notes", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" className="flex-1">
              Submit Meeting Record
            </Button>
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingFormPage;