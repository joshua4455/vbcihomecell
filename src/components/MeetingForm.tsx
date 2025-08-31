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

// Mock data for members
const cellMembers = [
  { id: 1, name: "John Smith", phone: "+1234567890" },
  { id: 2, name: "Mary Johnson", phone: "+1234567891" },
  { id: 3, name: "David Brown", phone: "+1234567892" },
  { id: 4, name: "Sarah Davis", phone: "+1234567893" },
  { id: 5, name: "Michael Wilson", phone: "+1234567894" },
  { id: 6, name: "Lisa Anderson", phone: "+1234567895" },
  { id: 7, name: "Robert Taylor", phone: "+1234567896" },
  { id: 8, name: "Jennifer White", phone: "+1234567897" }
];

export const MeetingForm = () => {
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedCell, setSelectedCell] = useState("");
  const [attendees, setAttendees] = useState<number[]>([]);
  const [newVisitors, setNewVisitors] = useState([{ name: "", contact: "", notes: "" }]);

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
    const updated = [...newVisitors];
    updated[index] = { ...updated[index], [field]: value };
    setNewVisitors(updated);
  };

  const removeVisitor = (index: number) => {
    setNewVisitors(newVisitors.filter((_, i) => i !== index));
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zone">Zone</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, i) => (
                    <SelectItem key={i + 1} value={`zone-${i + 1}`}>
                      Zone {String.fromCharCode(65 + i)} ({["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"][i]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cell">Cell</Label>
              <Select value={selectedCell} onValueChange={setSelectedCell} disabled={!selectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Cell" />
                </SelectTrigger>
                <SelectContent>
                  {selectedZone && Array.from({ length: 5 }, (_, i) => (
                    <SelectItem key={i + 1} value={`cell-${i + 1}`}>
                      Cell {selectedZone.split('-')[1]}-{i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeOpened">Time Opened</Label>
              <Input
                id="timeOpened"
                type="time"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeClosed">Time Closed</Label>
              <Input
                id="timeClosed"
                type="time"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="offering">Offering Amount ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="offering"
                  type="number"
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
              placeholder="Number of visits"
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="visitNotes">Visit Notes (Optional)</Label>
            <Textarea
              id="visitNotes"
              placeholder="Brief notes about visits made..."
              className="min-h-[80px]"
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" size="lg">
          Save as Draft
        </Button>
        <Button size="lg" className="bg-gradient-primary">
          <Save className="mr-2 h-5 w-5" />
          Submit Meeting Record
        </Button>
      </div>
    </div>
  );
};