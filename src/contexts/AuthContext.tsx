import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requirePasswordReset?: boolean }>;
  logout: () => void;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userData: Partial<User>) => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User followed a password recovery link. Ensure they land on the set-password page.
        try {
          const userProfile = await authService.getCurrentUser();
          if (userProfile) setUser(userProfile);
        } catch (e) {
          // Non-fatal
        }
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/set-password')) {
          window.location.replace('/set-password');
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        const userProfile = await authService.getCurrentUser();
        setUser(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; requirePasswordReset?: boolean }> => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', email);
      const result = await authService.signIn(email, password);
      console.log('Login result:', result);
      // Immediately populate user to avoid ProtectedRoute race
      try {
        const profile = await authService.getCurrentUser();
        if (profile) setUser(profile);
      } catch (e) {
        console.warn('Failed to build user profile immediately after login. Will rely on auth state change.', e);
      }
      // Fetch auth user with metadata to detect first-login password reset requirement
      const { data: authData } = await supabase.auth.getUser();
      const requirePasswordReset = authData.user?.user_metadata?.require_password_reset === true;
      return { success: true, requirePasswordReset };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Send password reset email with redirect to set-password
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const siteUrl = (import.meta as any)?.env?.VITE_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/set-password`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, message: 'If that email exists, a reset link has been sent.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send reset email' };
    }
  };

  // Verify OTP token from email and update password
  const resetPassword = async (email: string, token: string, newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token,
        email,
      });
      if (verifyErr) return { success: false, error: verifyErr.message };

      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) return { success: false, error: updateErr.message };

      // Best-effort: clear any require_password_reset flag
      await supabase.auth.updateUser({ data: { require_password_reset: false } });

      return { success: true, message: 'Password has been updated. You can sign in now.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to reset password' };
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      await authService.signUp(email, password, userData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      try {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        // Update in Supabase if needed
      } catch (error) {
        console.error('Update user error:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signUp,
    updateUser,
    requestPasswordReset,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
