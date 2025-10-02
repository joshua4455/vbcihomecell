// User Management utilities for Victory Bible Church Intl
import { User } from './types';

export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
  role: User['role'];
  zoneId?: string;
  areaId?: string;
  cellId?: string;
  temporaryPassword?: string;
}

export interface UserCreationResult {
  success: boolean;
  user?: User;
  credentials?: {
    email: string;
    temporaryPassword: string;
  };
  error?: string;
}

export class UserManagementService {
  private static instance: UserManagementService;

  private constructor() {}

  public static getInstance(): UserManagementService {
    if (!UserManagementService.instance) {
      UserManagementService.instance = new UserManagementService();
    }
    return UserManagementService.instance;
  }

  // Generate secure temporary password
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Validate email format and uniqueness
  private validateEmail(email: string, existingUsers: User[] = []): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    if (existingUsers.some(user => user.email.toLowerCase() === email.toLowerCase())) {
      return { valid: false, error: 'Email already exists' };
    }

    return { valid: true };
  }

  // Check if creator can create user with specified role
  private canCreateUser(
    creatorRole: User['role'], 
    targetRole: User['role'], 
    creatorZoneId?: string, 
    creatorAreaId?: string,
    targetZoneId?: string,
    targetAreaId?: string
  ): { allowed: boolean; reason?: string } {
    
    // Super admin can create anyone
    if (creatorRole === 'super-admin') {
      return { allowed: true };
    }

    // Zone leader can create area leaders and cell leaders in their zone
    if (creatorRole === 'zone-leader') {
      if (targetRole === 'super-admin' || targetRole === 'zone-leader') {
        return { allowed: false, reason: 'Zone leaders cannot create super admins or other zone leaders' };
      }
      if (targetZoneId && targetZoneId !== creatorZoneId) {
        return { allowed: false, reason: 'Zone leaders can only create users in their own zone' };
      }
      return { allowed: true };
    }

    // Area leader can only create cell leaders in their area
    if (creatorRole === 'area-leader') {
      if (targetRole !== 'cell-leader') {
        return { allowed: false, reason: 'Area leaders can only create cell leaders' };
      }
      if (targetAreaId && targetAreaId !== creatorAreaId) {
        return { allowed: false, reason: 'Area leaders can only create cell leaders in their own area' };
      }
      return { allowed: true };
    }

    // Cell leaders cannot create user accounts
    if (creatorRole === 'cell-leader') {
      return { allowed: false, reason: 'Cell leaders cannot create user accounts' };
    }

    return { allowed: false, reason: 'Insufficient permissions' };
  }

  // Create user account with proper role validation
  public async createUser(
    request: CreateUserRequest, 
    creatorRole: User['role'], 
    creatorZoneId?: string, 
    creatorAreaId?: string,
    existingUsers: User[] = []
  ): Promise<UserCreationResult> {
    try {
      // Validate creator permissions
      const canCreate = this.canCreateUser(
        creatorRole, 
        request.role, 
        creatorZoneId, 
        creatorAreaId, 
        request.zoneId, 
        request.areaId
      );
      
      if (!canCreate.allowed) {
        return { success: false, error: canCreate.reason };
      }

      // Validate email
      const emailValidation = this.validateEmail(request.email, existingUsers);
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error };
      }

      // Validate required fields
      if (!request.name.trim()) {
        return { success: false, error: 'Name is required' };
      }
      if (!request.phone.trim()) {
        return { success: false, error: 'Phone number is required' };
      }

      // Generate temporary password
      const temporaryPassword = request.temporaryPassword || this.generateTemporaryPassword();

      // Create user object
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: request.name.trim(),
        email: request.email.toLowerCase().trim(),
        role: request.role,
        phone: request.phone.trim(),
        zoneId: request.zoneId,
        areaId: request.areaId,
        cellId: request.cellId,
        isActive: true,
        createdAt: new Date(),
        lastLogin: undefined
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        user: newUser,
        credentials: {
          email: request.email,
          temporaryPassword
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to create user account' };
    }
  }

  // Get allowed roles for a creator
  public getAllowedRoles(creatorRole: User['role']): User['role'][] {
    switch (creatorRole) {
      case 'super-admin':
        return ['zone-leader', 'area-leader', 'cell-leader'];
      case 'zone-leader':
        return ['area-leader', 'cell-leader'];
      case 'area-leader':
        return ['cell-leader'];
      case 'cell-leader':
        return [];
      default:
        return [];
    }
  }

  // Generate user credentials display
  public formatCredentials(credentials: { email: string; temporaryPassword: string }): string {
    return `Email: ${credentials.email}\nTemporary Password: ${credentials.temporaryPassword}\n\nNote: User must change password on first login.`;
  }

  // Validate user creation request
  public validateCreateUserRequest(request: CreateUserRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.name.trim()) {
      errors.push('Name is required');
    }

    if (!request.email.trim()) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.email)) {
        errors.push('Invalid email format');
      }
    }

    if (!request.phone.trim()) {
      errors.push('Phone number is required');
    }

    if (!request.role) {
      errors.push('Role is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const userManagementService = UserManagementService.getInstance();
