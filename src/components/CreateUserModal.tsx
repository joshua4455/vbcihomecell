import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Mail, Phone, Shield, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { generateMemorablePassword } from '@/lib/utils';
import { User as UserType } from '@/lib/types';
import { authService } from '@/services/supabaseService';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: UserType, credentials: { email: string; temporaryPassword: string }) => void;
  availableZones?: Array<{ id: string; name: string }>;
  availableAreas?: Array<{ id: string; name: string; zoneId: string }>;
  preselectedZoneId?: string;
  preselectedAreaId?: string;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated,
  availableZones = [],
  availableAreas = [],
  preselectedZoneId,
  preselectedAreaId
}) => {
  const { user: currentUser } = useAuth();
  const { refreshData } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; temporaryPassword: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState<{ name: string; email: string; phone: string; role: UserType['role']; zoneId?: string; areaId?: string}>({
    name: '',
    email: '',
    phone: '',
    role: 'cell-leader',
    zoneId: preselectedZoneId || '',
    areaId: preselectedAreaId || ''
  });

  const allowedRoles = currentUser ? (
    currentUser.role === 'super-admin' ? ['zone-leader','area-leader','cell-leader','super-admin'] as UserType['role'][] :
    currentUser.role === 'zone-leader' ? ['area-leader','cell-leader'] as UserType['role'][] :
    currentUser.role === 'area-leader' ? ['cell-leader'] as UserType['role'][] :
    ['cell-leader'] as UserType['role'][]
  ) : [];
  const filteredAreas = availableAreas.filter(area => 
    !formData.zoneId || area.zoneId === formData.zoneId
  );

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'cell-leader',
      zoneId: preselectedZoneId || '',
      areaId: preselectedAreaId || ''
    });
    setError('');
    setShowCredentials(false);
    setCreatedCredentials(null);
    onClose();
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Inline validation
      const errs: string[] = [];
      if (!formData.name.trim()) errs.push('Name is required');
      if (!formData.email.trim()) errs.push('Email is required');
      if (!formData.role) errs.push('Role is required');
      if ((formData.role === 'zone-leader' || formData.role === 'area-leader' || formData.role === 'cell-leader') && !formData.zoneId) {
        errs.push('Zone is required for selected role');
      }
      if ((formData.role === 'area-leader' || formData.role === 'cell-leader') && !formData.areaId) {
        errs.push('Area is required for selected role');
      }
      if (errs.length) {
        setError(errs.join(', '));
        setIsLoading(false);
        return;
      }

      // Generate a compliant, memorable password
      const temporaryPassword = generateMemorablePassword(formData.name);

      // Provision via Edge Function
      const res: any = await authService.provisionUser({
        email: formData.email.trim(),
        password: temporaryPassword,
        name: formData.name.trim(),
        phone: formData.phone || undefined,
        role: formData.role,
        zone_id: formData.zoneId || undefined,
        area_id: formData.areaId || undefined,
      });

      const userId = res?.userId || res?.user?.id;
      if (!userId) {
        setError('User creation failed.');
        setIsLoading(false);
        return;
      }

      // Build a minimal user object for callback
      const createdUser: UserType = {
        id: userId,
        name: formData.name.trim(),
        email: formData.email.trim() as any,
        phone: formData.phone,
        role: formData.role,
        zoneId: formData.zoneId as any,
        areaId: formData.areaId as any,
        isActive: true as any,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      } as unknown as UserType;

      // Keep UI data in sync with database/auth
      await refreshData();

      const effectivePassword = (res?.password as string) || temporaryPassword;
      const creds = { email: formData.email.trim(), temporaryPassword: effectivePassword };
      setCreatedCredentials(creds);
      setShowCredentials(true);
      onUserCreated(createdUser, creds);
    } catch (error: any) {
      setError(error?.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (showCredentials && createdCredentials) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              User Created Successfully
            </DialogTitle>
            <DialogDescription>
              Save these credentials and share them securely with the new user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                The user must change their password on first login for security.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{createdCredentials.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                >
                  {copiedField === 'email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Password</Label>
                  <p className="text-sm text-muted-foreground font-mono">{createdCredentials.temporaryPassword}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(createdCredentials.temporaryPassword, 'password')}
                >
                  {copiedField === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account with appropriate permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@victorybible.org"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+233 123 456 789"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserType['role']) => setFormData({ ...formData, role: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(formData.role === 'zone-leader' || formData.role === 'area-leader' || formData.role === 'cell-leader') && availableZones.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="zone">Zone</Label>
              <Select
                value={formData.zoneId}
                onValueChange={(value) => setFormData({ ...formData, zoneId: value, areaId: '' })}
                disabled={isLoading || !!preselectedZoneId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {availableZones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(formData.role === 'area-leader' || formData.role === 'cell-leader') && filteredAreas.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Select
                value={formData.areaId}
                onValueChange={(value) => setFormData({ ...formData, areaId: value })}
                disabled={isLoading || !!preselectedAreaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
