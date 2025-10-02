import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'cell-leader' | 'super-admin' | 'area-leader' | 'zone-leader';
  fallbackPath?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  fallbackPath = '/login' 
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [requireReset, setRequireReset] = useState<boolean | null>(null);
  const [hasAuthUser, setHasAuthUser] = useState<boolean | null>(null);

  // Safety net: if auth user metadata requires password reset, force redirect
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      setHasAuthUser(!!data.user);
      setRequireReset(data.user?.user_metadata?.require_password_reset === true);
    };
    check();
  }, []);

  // Debug logging
  console.log('ProtectedRoute Debug:', {
    isLoading,
    isAuthenticated,
    user: user ? { id: user.id, name: user.name, role: user.role } : null,
    requiredRole,
    currentPath: location.pathname
  });

  if (isLoading || requireReset === null || hasAuthUser === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If Supabase shows an active session, wait for profile to load instead of redirecting
    if (hasAuthUser) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Preparing your dashboard...</p>
          </div>
        </div>
      );
    }
    console.log('Not authenticated, redirecting to:', fallbackPath);
    // Redirect to login with the intended destination
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requireReset && location.pathname !== '/set-password') {
    return <Navigate to="/set-password" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // User doesn't have the required role, redirect to appropriate dashboard
    let redirectPath = '/dashboard';
    
    switch (user?.role) {
      case 'zone-leader':
        redirectPath = '/zone-dashboard';
        break;
      case 'area-leader':
        redirectPath = '/area-dashboard';
        break;
      case 'super-admin':
        redirectPath = '/admin';
        break;
      default:
        redirectPath = '/dashboard';
    }
    
    console.log('Role mismatch. User role:', user?.role, 'Required role:', requiredRole, 'Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  console.log('Access granted to:', location.pathname);
  return <>{children}</>;
};
