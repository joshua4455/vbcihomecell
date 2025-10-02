import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertCircle, MessageSquare, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";

interface AlertNotificationsProps {
  userRole: "cell-leader" | "area-leader" | "zone-leader" | "super-admin";
}

const AlertNotifications = ({ userRole }: AlertNotificationsProps) => {
  const { alerts } = useData();
  const { user } = useAuth();
  // Track dismissed IDs by UUID string (not numeric parsing)
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Map single-role to alerts table audience values
  const roleToAudience: Record<string, string> = {
    "super-admin": "super-admins",
    "zone-leader": "zone-leaders",
    "area-leader": "area-leaders",
    "cell-leader": "cell-leaders",
  };

  // Filter alerts based on active status, optional per-user recipients, and audience targeting
  const relevantAlerts = alerts.filter((a: any) => {
    if (!a?.is_active) return false;
    if (!a?.id || dismissedIds.includes(a.id)) return false;

    // If recipients specified (optional column), only show to those users
    const recipients: string[] | undefined = (a as any).recipient_user_ids || (a as any).target_user_ids;
    if (Array.isArray(recipients) && recipients.length > 0) {
      if (!user?.id) return false;
      return recipients.includes(user.id);
    }

    // Otherwise, match audience by role
    if (userRole === "super-admin") {
      // Super admins see all alerts
      return true;
    }
    const audience = roleToAudience[userRole] || "";
    return a.target_audience === "all" || a.target_audience === audience;
  });

  const dismissAlert = (alertId: string) => {
    setDismissedIds((prev) => (prev.includes(alertId) ? prev : [...prev, alertId]));
  };

  if (relevantAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {relevantAlerts.map((alert: any) => (
        <Alert 
          key={alert.id} 
          variant={alert.type === "error" ? "destructive" : "default"}
          className="relative"
        >
          <div className="flex items-start space-x-3">
            {alert.type === "info" && <MessageSquare className="h-4 w-4 mt-0.5" />}
            {alert.type === "warning" && <AlertCircle className="h-4 w-4 mt-0.5 text-orange-500" />}
            {alert.type === "error" && <AlertCircle className="h-4 w-4 mt-0.5" />}
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <AlertTitle className="flex items-center space-x-2">
                  <span>{alert.title}</span>
                  <Badge 
                    variant={alert.priority === "high" ? "destructive" : alert.priority === "normal" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {alert.priority}
                  </Badge>
                </AlertTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                  className="h-6 w-6 p-0 hover:bg-transparent"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AlertDescription className="text-sm">
                {alert.message}
              </AlertDescription>
              <p className="text-xs text-muted-foreground">
                {new Date(alert.created_at).toLocaleDateString()} at {new Date(alert.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default AlertNotifications;