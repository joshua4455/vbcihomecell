import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Member as DBMember } from "@/lib/supabase";
import { Plus, Edit, Trash2, UserPlus, Phone, Mail, Calendar, Users } from "lucide-react";

interface MemberManagementProps {
  cellId: string;
}

export const MemberManagement = ({ cellId }: MemberManagementProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DBMember | null>(null);
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    email: "",
    notes: ""
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { members, meetings, addMember, updateMember, deleteMember, getMeetingsByCell } = useData();
  
  // Members for this cell from the global members table
  const cellMembers = (members || []).filter((m: any) => m.cell_id === cellId);

  // Meetings for this cell
  const cellMeetings = getMeetingsByCell ? getMeetingsByCell(cellId) : (meetings || []).filter((mtg: any) => (mtg as any).cell_id === cellId);
  const sortedMeetings = [...cellMeetings].sort((a: any, b: any) => new Date((b as any).date).getTime() - new Date((a as any).date).getTime());
  const totalMembers = cellMembers.length;

  // Determine the most recent meeting date a member attended.
  // Uses meeting.attendees (string[]) when available; otherwise, if attendance_count equals totalMembers,
  // we assume everyone attended (fallback for legacy records without attendee lists).
  const getLastAttendanceDate = (memberId: string): string | null => {
    for (const m of sortedMeetings as any[]) {
      const ids = (m as any).attendees as string[] | undefined;
      const hasArray = Array.isArray(ids);
      const attendanceCount = (m as any).attendance_count || 0;
      const allAttended = !hasArray && totalMembers > 0 && attendanceCount === totalMembers;
      const attended = hasArray ? (ids as string[]).includes(memberId) : allAttended;
      if (attended) {
        try {
          return new Date((m as any).date).toLocaleDateString();
        } catch {
          return (m as any).date;
        }
      }
    }
    return null;
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.phone) {
      toast({
        title: "Validation Error",
        description: "Name and phone number are required.",
        variant: "destructive",
      });
      return;
    }

    const payload: Omit<DBMember, 'id' | 'created_at' | 'updated_at'> = {
      name: newMember.name.trim(),
      phone: newMember.phone.trim(),
      email: newMember.email?.trim() || undefined,
      cell_id: cellId,
      date_joined: new Date().toISOString(),
      status: 'active',
    } as any;

    try {
      await addMember(payload as any);
      toast({
        title: "Member Added",
        description: `${newMember.name} has been added to the cell.`,
      });
      setNewMember({ name: "", phone: "", email: "", notes: "" });
      setIsAddDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Failed to add member",
        description: err?.message || 'An error occurred while adding the member.',
        variant: "destructive",
      });
    }
  };

  const handleEditMember = async () => {
    if (!editingMember || !editingMember.name || !editingMember.phone) {
      toast({
        title: "Validation Error",
        description: "Name and phone number are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateMember(editingMember.id, {
        name: editingMember.name.trim(),
        phone: editingMember.phone.trim(),
        email: editingMember.email || undefined,
        status: editingMember.status || 'active',
      });
      toast({
        title: "Member Updated",
        description: `${editingMember.name}'s information has been updated.`,
      });
      setEditingMember(null);
      setIsEditDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Failed to update member",
        description: err?.message || 'An error occurred while updating the member.',
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const memberToDelete = cellMembers.find(m => m.id === memberId);
      await deleteMember(memberId);
      toast({
        title: "Member Removed",
        description: `${memberToDelete?.name || 'Member'} has been removed from the cell.`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to remove member",
        description: err?.message || 'An error occurred while removing the member.',
        variant: "destructive",
      });
    }
  };

  const toggleMemberStatus = async (memberId: string) => {
    try {
      const member = cellMembers.find(m => m.id === memberId);
      const newStatus = member?.status === 'active' ? 'inactive' : 'active';
      await updateMember(memberId, { status: newStatus });
      toast({
        title: "Status Updated",
        description: `${member?.name || 'Member'} is now ${newStatus}.`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to update status",
        description: err?.message || 'An error occurred while updating status.',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cell Members</h2>
          <p className="text-muted-foreground">
            Manage {cellMembers.length} registered members
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>
                Add a new member to your cell. Fill in the required information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Enter member's full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="+234 801 234 5678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="member@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newMember.notes}
                  onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                  placeholder="Additional notes about the member..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember}>
                Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cellMembers.map((member: any) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={member.status === 'active' ? "default" : "secondary"}>
                      {member.status === 'active' ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Joined {member.date_joined ? new Date(member.date_joined).toLocaleDateString() : '—'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingMember(member as DBMember);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMember(member.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{member.phone}</span>
                </div>
                
                {member.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{member.email}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Last attendance: {getLastAttendanceDate(member.id) || '—'}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMemberStatus(member.id)}
                  className="w-full"
                >
                  {member.status === 'active' ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member information. Make your changes and click save.
            </DialogDescription>
          </DialogHeader>
          
          {editingMember && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingMember.email || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingMember.status || "active"}
                  onValueChange={(value) => 
                    setEditingMember({ ...editingMember, status: value as 'active' | 'inactive' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMember}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {members.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Members Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your cell by adding the first member.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add First Member
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


