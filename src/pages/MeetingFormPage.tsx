import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Logo } from "@/components/Logo";
import { Meeting, Visitor } from "@/lib/types";

const MeetingFormPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { cells, addMeeting, members, areas } = useData();
  
  const [attendees, setAttendees] = useState<string[]>([]);
  const [newVisitors, setNewVisitors] = useState<Omit<Visitor, 'id'>[]>([
    { name: "", contact: "", notes: "", isConvert: false, followUpRequired: false }
  ]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeOpened: "",
    timeClosed: "",
    offering: "",
    visitsCount: "",
    visitNotes: "",
  });

  // Get current user's cell
  const currentCell: any =
    cells.find((cell: any) => cell.id === (user as any)?.cell_id) ||
    cells.find((cell: any) => (cell as any).leader_id === (user as any)?.id);
  const cellMembers = currentCell
    ? (members as any[]).filter((m: any) => (m as any).cell_id === (currentCell as any).id)
    : [];

  const handleAttendanceChange = (memberId: string, checked: boolean) => {
    if (checked) {
      setAttendees([...attendees, memberId]);
    } else {
      setAttendees(attendees.filter(id => id !== memberId));
    }
  };

  const addNewVisitor = () => {
    setNewVisitors([...newVisitors, { name: "", contact: "", notes: "", isConvert: false, followUpRequired: false }]);
  };

  const updateVisitor = (index: number, field: keyof Visitor, value: string | boolean) => {
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
    
    if (!currentCell) {
      toast({
        title: "Error",
        description: "No cell found for current user.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.timeOpened || !formData.timeClosed || !formData.offering) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Create meeting object
    const meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'> = {
      cellId: currentCell.id,
      areaId: currentCell.area_id,
      date: new Date(formData.date),
      timeOpened: formData.timeOpened,
      timeClosed: formData.timeClosed,
      attendees,
      offering: parseFloat(formData.offering),
      newVisitors: newVisitors.filter(v => v.name).map(v => ({
        ...v,
        id: `visitor-${Date.now()}-${Math.random()}`,
      })),
      visitsCount: parseInt(formData.visitsCount) || 0,
      visitNotes: formData.visitNotes,
      status: 'submitted'
    };

    // Add meeting to data context
    addMeeting(meetingData);

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

  if (!currentCell) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Logo size="xl" className="text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">No Cell Assigned</h2>
          <p className="text-muted-foreground">Please contact your area leader to be assigned to a cell.</p>
        </div>
      </div>
    );
  }

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
                <Logo size="md" className="text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Record Meeting</h1>
                <p className="text-sm text-muted-foreground">{currentCell.name} • {(currentCell as any).area_id}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                  <Label htmlFor="date">Meeting Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
              </div>

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
                <Label htmlFor="offering">Offering Amount (₵)</Label>
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
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`convert-${index}`}
                            checked={visitor.isConvert}
                            onCheckedChange={(checked) => updateVisitor(index, "isConvert", checked as boolean)}
                          />
                          <Label htmlFor={`convert-${index}`}>New Convert</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`followup-${index}`}
                            checked={visitor.followUpRequired}
                            onCheckedChange={(checked) => updateVisitor(index, "followUpRequired", checked as boolean)}
                          />
                          <Label htmlFor={`followup-${index}`}>Follow-up Required</Label>
                        </div>
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
              <Save className="mr-2 h-4 w-4" />
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