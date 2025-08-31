import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, AlertCircle, MessageSquare, X } from "lucide-react";
import { useState } from "react";

interface AlertData {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "alert";
  targetAudience: string;
  priority: "low" | "normal" | "high";
  createdAt: string;
  active: boolean;
}

interface AlertNotificationsProps {
  userRole: "cell-leader" | "zone-leader" | "super-admin";
}

const AlertNotifications = ({ userRole }: AlertNotificationsProps) => {
  // Demo alerts - in real app, this would come from backend
  const allAlerts: AlertData[] = [
    {
      id: 1,
      title: "Zone Leader Meeting",
      message: "Monthly zone leader meeting scheduled for next Friday at 6 PM. Please confirm your attendance.",
      type: "info",
      targetAudience: "zone-leaders",
      priority: "high",
      createdAt: "2 hours ago",
      active: true
    },
    {
      id: 2,
      title: "Cell Reports Due",
      message: "All cell leaders must submit their monthly reports by end of week. Late submissions will be followed up.",
      type: "warning",
      targetAudience: "cell-leaders",
      priority: "normal",
      createdAt: "1 day ago",
      active: true
    },
    {
      id: 3,
      title: "System Maintenance",
      message: "The system will undergo maintenance this Sunday from 2-4 AM. Expect brief service interruptions.",
      type: "alert",
      targetAudience: "all",
      priority: "high",
      createdAt: "3 days ago",
      active: true
    }
  ];

  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);

  // Filter alerts based on user role and target audience
  const relevantAlerts = allAlerts.filter(alert => {
    if (!alert.active || dismissedAlerts.includes(alert.id)) return false;
    
    if (alert.targetAudience === "all") return true;
    if (alert.targetAudience === "zone-leaders" && userRole === "zone-leader") return true;
    if (alert.targetAudience === "cell-leaders" && userRole === "cell-leader") return true;
    
    return false;
  });

  const dismissAlert = (alertId: number) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  if (relevantAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {relevantAlerts.map((alert) => (
        <Alert 
          key={alert.id} 
          variant={alert.type === "alert" ? "destructive" : "default"}
          className="relative"
        >
          <div className="flex items-start space-x-3">
            {alert.type === "info" && <MessageSquare className="h-4 w-4 mt-0.5" />}
            {alert.type === "warning" && <AlertCircle className="h-4 w-4 mt-0.5 text-orange-500" />}
            {alert.type === "alert" && <AlertCircle className="h-4 w-4 mt-0.5" />}
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <AlertTitle className="flex items-center space-x-2">
                  <span>{alert.title}</span>
                  <Badge 
                    variant={alert.priority === "high" ? "destructive" : "secondary"}
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
                {alert.createdAt}
              </p>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default AlertNotifications;