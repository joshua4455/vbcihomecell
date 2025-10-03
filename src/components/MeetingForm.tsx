import { useState } from "react";
import { Clock, Users, DollarSign, UserPlus, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/hooks/use-toast";

export const MeetingForm = () => {
  const { user } = useAuth();
  const { cells, areas, members, addMeeting } = useData();
  const { toast } = useToast();
  
  // Get the current user's cell
  const currentCell =
    cells.find((cell: any) => cell.id === (user as any)?.cell_id) ||
    cells.find((cell: any) => (cell as any).leader_id === (user as any)?.id);
  const currentArea =
    areas.find((area: any) => area.id === (user as any)?.area_id) ||
    areas.find((area: any) => area.id === (currentCell as any)?.area_id);
  
  // Get real cell members instead of mock data
  const cellMembers = currentCell
    ? (members as any[]).filter((m: any) => (m as any).cell_id === (currentCell as any).id)
    : [];
  
  const [selectedArea, setSelectedArea] = useState((user as any)?.area_id || "");
  const [selectedCell, setSelectedCell] = useState((user as any)?.cell_id || "");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [newVisitors, setNewVisitors] = useState([{ name: "", contact: "", notes: "", isConvert: false, followUpRequired: false }]);
  
  // Form data state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeOpened: "",
    timeClosed: "",
    offering: 0,
    visits: 0,
    visitNotes: "",
    status: "draft" as "draft" | "completed"
  });

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

  const updateVisitor = (index: number, field: string, value: string | boolean) => {
    const updated = [...newVisitors];
    updated[index] = { ...updated[index], [field]: value };
    setNewVisitors(updated);
  };

  const removeVisitor = (index: number) => {
    setNewVisitors(newVisitors.filter((_, i) => i !== index));
  };

  // Form submission functions
  const handleSaveAsDraft = async () => {
    if (!currentCell) {
      toast({
        title: "Error",
        description: "No cell assigned. Please contact your area leader.",
        variant: "destructive",
      });
      return;
    }

    // Compute visitor-related counts for aggregation
    const namedVisitors = newVisitors.filter(v => (v.name || '').trim().length > 0);
    const visitorsCount = namedVisitors.length;
    const convertsCount = namedVisitors.filter(v => v.isConvert).length;
    const followupsCount = namedVisitors.filter(v => v.followUpRequired).length;

    // Persist using Supabase Meeting schema
    const meetingData: any = {
      cell_id: (currentCell as any).id,
      date: new Date(formData.date).toISOString(),
      attendance_count: attendees.length,
      offering_amount: formData.offering,
      notes: formData.visitNotes || undefined,
      // Weekly activities & visitor metrics (optional columns)
      visits_count: Number(formData.visits) || 0,
      visitors_count: visitorsCount,
      converts_count: convertsCount,
      followups_count: followupsCount,
    };

    try {
      await addMeeting(meetingData as any);
      toast({
        title: "Draft Saved",
        description: "Meeting record has been saved as draft successfully.",
      });
    } catch (err: any) {
      // Fallback: retry without extended columns if DB migration not applied yet
      const basePayload: any = {
        cell_id: (currentCell as any).id,
        date: new Date(formData.date).toISOString(),
        attendance_count: attendees.length,
        offering_amount: formData.offering,
        notes: formData.visitNotes || undefined,
      };
      try {
        await addMeeting(basePayload);
        toast({
          title: "Draft Saved",
          description: "Meeting saved without new metrics (DB migration pending).",
        });
      } catch (err2: any) {
        toast({
          title: "Save Failed",
          description: (err2?.message || err?.message || 'Unable to save meeting. Please try again.'),
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmitMeeting = async () => {
    if (!currentCell) {
      toast({
        title: "Error",
        description: "No cell assigned. Please contact your area leader.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.timeOpened || !formData.timeClosed) {
      toast({
        title: "Validation Error",
        description: "Please fill in meeting start and end times.",
        variant: "destructive",
      });
      return;
    }

    if (attendees.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one attendee.",
        variant: "destructive",
      });
      return;
    }

    // Compute visitor-related counts for aggregation
    const namedVisitors = newVisitors.filter(v => (v.name || '').trim().length > 0);
    const visitorsCount = namedVisitors.length;
    const convertsCount = namedVisitors.filter(v => v.isConvert).length;
    const followupsCount = namedVisitors.filter(v => v.followUpRequired).length;

    // Persist using Supabase Meeting schema
    const meetingData: any = {
      cell_id: (currentCell as any).id,
      date: new Date(formData.date).toISOString(),
      attendance_count: attendees.length,
      offering_amount: formData.offering,
      notes: formData.visitNotes || undefined,
      // Weekly activities & visitor metrics (optional columns)
      visits_count: Number(formData.visits) || 0,
      visitors_count: visitorsCount,
      converts_count: convertsCount,
      followups_count: followupsCount,
    };

    try {
      await addMeeting(meetingData as any);
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        timeOpened: "",
        timeClosed: "",
        offering: 0,
        visits: 0,
        visitNotes: "",
        status: "draft"
      });
      setAttendees([]);
      setNewVisitors([{ name: "", contact: "", notes: "", isConvert: false, followUpRequired: false }]);
      toast({
        title: "Meeting Submitted",
        description: "Meeting record has been submitted successfully.",
      });
    } catch (err: any) {
      // Fallback: retry without extended columns if DB migration not applied yet
      const basePayload: any = {
        cell_id: (currentCell as any).id,
        date: new Date(formData.date).toISOString(),
        attendance_count: attendees.length,
        offering_amount: formData.offering,
        notes: formData.visitNotes || undefined,
      };
      try {
        await addMeeting(basePayload);
        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          timeOpened: "",
          timeClosed: "",
          offering: 0,
          visits: 0,
          visitNotes: "",
          status: "draft"
        });
        setAttendees([]);
        setNewVisitors([{ name: "", contact: "", notes: "", isConvert: false, followUpRequired: false }]);
        toast({
          title: "Meeting Submitted",
          description: "Meeting saved without new metrics (DB migration pending).",
        });
      } catch (err2: any) {
        toast({
          title: "Submission Failed",
          description: (err2?.message || err?.message || 'Unable to submit meeting. Please try again.'),
          variant: "destructive",
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Meeting Details */}
      <Card className="shadow-elevation">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <Clock className="mr-2 h-5 w-5" />
            Meeting Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Meeting Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                value={currentCell ? (areas as any[]).find((a: any) => a.id === (currentCell as any).area_id)?.name || "Unknown Area" : "No Area Assigned"}
                disabled
                className="w-full bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cell">Cell</Label>
              <Input
                id="cell"
                value={currentCell?.name || "No Cell Assigned"}
                disabled
                className="w-full bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeOpened">Time Opened</Label>
              <Input
                id="timeOpened"
                type="time"
                value={formData.timeOpened}
                onChange={(e) => handleInputChange("timeOpened", e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeClosed">Time Closed</Label>
              <Input
                id="timeClosed"
                type="time"
                value={formData.timeClosed}
                onChange={(e) => handleInputChange("timeClosed", e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="offering">Offering Amount (₵)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="offering"
                  type="number"
                  value={formData.offering}
                  onChange={(e) => handleInputChange("offering", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-10"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card className="shadow-elevation">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-primary">
              <Users className="mr-2 h-5 w-5" />
              Attendance ({attendees.length}/{cellMembers.length})
            </CardTitle>
            <Badge variant="secondary">
              {Math.round((attendees.length / cellMembers.length) * 100)}% Present
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Select members who attended:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cellMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`member-${member.id}`}
                    checked={attendees.includes(member.id)}
                    onCheckedChange={(checked) => handleAttendanceChange(member.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`member-${member.id}`} className="text-sm font-medium cursor-pointer">
                      {member.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">{member.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Activities */}
      <Card className="shadow-elevation">
        <CardHeader>
          <CardTitle className="text-primary">Weekly Activities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visits">Visits Made During the Week</Label>
            <Input
              id="visits"
              type="number"
              value={formData.visits}
              onChange={(e) => handleInputChange("visits", parseInt(e.target.value) || 0)}
              placeholder="Number of visits"
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="visitNotes">Visit Notes (Optional)</Label>
            <Textarea
              id="visitNotes"
              value={formData.visitNotes}
              onChange={(e) => handleInputChange("visitNotes", e.target.value)}
              placeholder="Brief notes about visits made..."
              className="min-h-[60px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* New Visitors/Converts */}
      <Card className="shadow-elevation">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-primary">
              <UserPlus className="mr-2 h-5 w-5" />
              New Visitors & Converts
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addNewVisitor}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Visitor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {newVisitors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No new visitors recorded. Click "Add Visitor" to add someone new.
            </p>
          ) : (
            <div className="space-y-4">
              {newVisitors.map((visitor, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Visitor {index + 1}</Label>
                    {newVisitors.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVisitor(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`visitor-name-${index}`}>Name</Label>
                      <Input
                        id={`visitor-name-${index}`}
                        value={visitor.name}
                        onChange={(e) => updateVisitor(index, "name", e.target.value)}
                        placeholder="Visitor's full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`visitor-contact-${index}`}>Contact</Label>
                      <Input
                        id={`visitor-contact-${index}`}
                        value={visitor.contact}
                        onChange={(e) => updateVisitor(index, "contact", e.target.value)}
                        placeholder="Phone or email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`visitor-notes-${index}`}>Notes (Optional)</Label>
                    <Textarea
                      id={`visitor-notes-${index}`}
                      value={visitor.notes}
                      onChange={(e) => updateVisitor(index, "notes", e.target.value)}
                      placeholder="Additional notes about this visitor..."
                      className="min-h-[60px]"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`visitor-convert-${index}`}
                        checked={visitor.isConvert}
                        onCheckedChange={(checked) => updateVisitor(index, "isConvert", checked as boolean)}
                      />
                      <Label htmlFor={`visitor-convert-${index}`} className="text-sm">
                        Converted to Christ
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`visitor-followup-${index}`}
                        checked={visitor.followUpRequired}
                        onCheckedChange={(checked) => updateVisitor(index, "followUpRequired", checked as boolean)}
                      />
                      <Label htmlFor={`visitor-followup-${index}`} className="text-sm">
                        Follow-up Required
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={handleSaveAsDraft}
        >
          Save as Draft
        </Button>
        <Button 
          size="lg" 
          className="bg-gradient-primary"
          onClick={handleSubmitMeeting}
        >
          <Save className="mr-2 h-5 w-5" />
          Submit Meeting Record
        </Button>
      </div>
    </div>
  );
};