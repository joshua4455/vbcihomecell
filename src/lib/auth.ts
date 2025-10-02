// JWT Authentication utilities for Victory Bible Church Intl
import { User } from './types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirm {
  token: string;
  newPassword: string;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'vbc_access_token';
const REFRESH_TOKEN_KEY = 'vbc_refresh_token';
const TOKEN_EXPIRY_KEY = 'vbc_token_expiry';
const USER_DATA_KEY = 'vbc_user_data';

// Session timeout (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000;
let sessionTimer: NodeJS.Timeout | null = null;

export class AuthService {
  private static instance: AuthService;
  private onSessionExpired?: () => void;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Set session expiration callback
  public setSessionExpiredCallback(callback: () => void) {
    this.onSessionExpired = callback;
  }

  // JWT Token Management
  public setTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, tokens.expiresAt.toString());
    this.startSessionTimer();
  }

  public getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    return Date.now() >= parseInt(expiryTime);
  }

  public clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    this.stopSessionTimer();
  }

  // Session Management
  public startSessionTimer(): void {
    this.stopSessionTimer();
    
    sessionTimer = setTimeout(() => {
      this.handleSessionExpiry();
    }, SESSION_TIMEOUT);
  }

  public resetSessionTimer(): void {
    if (this.isAuthenticated()) {
      this.startSessionTimer();
    }
  }

  private stopSessionTimer(): void {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      sessionTimer = null;
    }
  }

  private handleSessionExpiry(): void {
    this.clearTokens();
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
  }

  // Authentication Status
  public isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return token !== null && !this.isTokenExpired();
  }

  // User Data Management
  public setUserData(user: User): void {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }

  public getUserData(): User | null {
    const userData = localStorage.getItem(USER_DATA_KEY);
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Role-based Access Control
  public hasPermission(requiredRole: User['role'], userRole?: User['role']): boolean {
    if (!userRole) {
      const user = this.getUserData();
      if (!user) return false;
      userRole = user.role;
    }

    const roleHierarchy = {
      'super-admin': 4,
      'zone-leader': 3,
      'area-leader': 2,
      'cell-leader': 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  public canAccessZone(zoneId: string, user?: User): boolean {
    if (!user) {
      user = this.getUserData();
      if (!user) return false;
    }

    if (user.role === 'super-admin') return true;
    if (user.role === 'zone-leader' && user.zoneId === zoneId) return true;
    
    return false;
  }

  public canAccessArea(areaId: string, user?: User): boolean {
    if (!user) {
      user = this.getUserData();
      if (!user) return false;
    }

    if (user.role === 'super-admin') return true;
    if (user.role === 'zone-leader') return true; // Zone leaders can access all areas in their zone
    if (user.role === 'area-leader' && user.areaId === areaId) return true;
    
    return false;
  }

  public canAccessCell(cellId: string, user?: User): boolean {
    if (!user) {
      user = this.getUserData();
      if (!user) return false;
    }

    if (user.role === 'super-admin') return true;
    if (user.role === 'zone-leader') return true;
    if (user.role === 'area-leader') return true;
    if (user.role === 'cell-leader' && user.cellId === cellId) return true;
    
    return false;
  }

  // Mock API calls (replace with real API endpoints)
  public async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; tokens?: AuthTokens; error?: string }> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Password storage for authentication (in production, this would be hashed)
      interface AuthUser extends User {
        password: string;
      }

      // Get users from DataContext via localStorage or return default users
      const getAuthUsers = (): AuthUser[] => {
        try {
          const storedUsers = localStorage.getItem('gospel-gather-users');
          if (storedUsers) {
            const users: User[] = JSON.parse(storedUsers);
            return users.map(user => ({
              ...user,
              password: generateDefaultPassword(user.email), // Generate default password
              createdAt: new Date(user.createdAt),
              lastLogin: user.lastLogin ? new Date(user.lastLogin) : new Date()
            }));
          }
        } catch (error) {
          console.error('Error loading users from localStorage:', error);
        }

        // Fallback to default users if no stored users
        return [
          {
            id: '1',
            email: 'admin@victorybible.org',
            password: 'Admin123!',
            name: 'Pastor Emmanuel Kwame',
            role: 'super-admin' as const,
            phone: '+233 123 456 7890',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            lastLogin: new Date()
          },
          {
            id: '2',
            email: 'zone@victorybible.org',
            password: 'Zone123!',
            name: 'Pastor Grace Mensah',
            role: 'zone-leader' as const,
            zoneId: 'zone-1',
            phone: '+233 124 567 8901',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            lastLogin: new Date()
          },
          {
            id: '3',
            email: 'area@victorybible.org',
            password: 'Area123!',
            name: 'Elder Joseph Asante',
            role: 'area-leader' as const,
            areaId: 'area-1',
            zoneId: 'zone-1',
            phone: '+233 125 678 9012',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            lastLogin: new Date()
          },
          {
            id: '4',
            email: 'cell@victorybible.org',
            password: 'Cell123!',
            name: 'Sister Mary Osei',
            role: 'cell-leader' as const,
            areaId: 'area-1',
            cellId: 'cell-1',
            phone: '+233 126 789 0123',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            lastLogin: new Date()
          }
        ];
      };

      // Generate default password for new users
      const generateDefaultPassword = (email: string): string => {
        // Generate password that meets policy requirements
        const username = email.split('@')[0];
        return `${username.charAt(0).toUpperCase()}${username.slice(1)}123!`;
      };

      const mockUsers = getAuthUsers();

      const user = mockUsers.find(u => u.email === credentials.email);
      
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check password - use generated default password or stored password
      if (user.password !== credentials.password) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Generate mock JWT tokens
      const tokens: AuthTokens = {
        accessToken: `mock_jwt_${user.id}_${Date.now()}`,
        refreshToken: `mock_refresh_${user.id}_${Date.now()}`,
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
      };

      // Update last login
      user.lastLogin = new Date();

      return { success: true, user, tokens };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  public async refreshToken(): Promise<{ success: boolean; tokens?: AuthTokens; error?: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const tokens: AuthTokens = {
        accessToken: `refreshed_jwt_${Date.now()}`,
        refreshToken: `refreshed_refresh_${Date.now()}`,
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
      };

      return { success: true, tokens };
    } catch (error) {
      return { success: false, error: 'Token refresh failed' };
    }
  }

  public async requestPasswordReset(request: ResetPasswordRequest): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock validation
      const validEmails = ['admin@victorybible.org', 'zone@victorybible.org', 'area@victorybible.org', 'cell@victorybible.org'];
      
      if (!validEmails.includes(request.email)) {
        return { success: false, error: 'Email address not found' };
      }

      return { 
        success: true, 
        message: 'Password reset instructions have been sent to your email address.' 
      };
    } catch (error) {
      return { success: false, error: 'Failed to send reset email. Please try again.' };
    }
  }

  public async resetPassword(request: ResetPasswordConfirm): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock token validation
      if (!request.token.startsWith('reset_token_')) {
        return { success: false, error: 'Invalid or expired reset token' };
      }

      // Mock password validation
      if (request.newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters long' };
      }

      return { 
        success: true, 
        message: 'Password has been reset successfully. You can now log in with your new password.' 
      };
    } catch (error) {
      return { success: false, error: 'Password reset failed. Please try again.' };
    }
  }

  public logout(): void {
    this.clearTokens();
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
