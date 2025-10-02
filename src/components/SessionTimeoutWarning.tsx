import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SessionTimeoutWarningProps {
  warningTimeMs?: number; // Show warning this many ms before session expires
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({ 
  warningTimeMs = 5 * 60 * 1000 // 5 minutes default
}) => {
  const { isAuthenticated, logout, refreshToken } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    // Check session status every minute
    const interval = setInterval(() => {
      const expiryTime = localStorage.getItem('vbc_token_expiry');
      if (!expiryTime) return;

      const timeUntilExpiry = parseInt(expiryTime) - Date.now();
      
      if (timeUntilExpiry <= warningTimeMs && timeUntilExpiry > 0) {
        setTimeRemaining(Math.ceil(timeUntilExpiry / 1000 / 60)); // Convert to minutes
        setShowWarning(true);
      } else if (timeUntilExpiry <= 0) {
        setShowWarning(false);
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, warningTimeMs, logout]);

  const handleExtendSession = async () => {
    try {
      await refreshToken();
      setShowWarning(false);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
    }
  };

  const handleLogout = () => {
    setShowWarning(false);
    logout();
  };

  if (!showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription>
            Your session will expire in approximately {timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            For your security, you'll be automatically logged out due to inactivity. 
            Would you like to extend your session?
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            Logout Now
          </Button>
          <Button onClick={handleExtendSession} className="w-full sm:w-auto">
            Extend Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
