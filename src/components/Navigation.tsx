import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";

export const Navigation = () => {
  const { user, logout } = useAuth();
  const { alerts } = useData();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };
  
  // Calculate relevant alerts for the current user
  const relevantAlerts = alerts.filter(alert => {
    if (!alert.isActive) return false;
    
    // Super admins can see all alerts
    if (user?.role === "super-admin") return true;
    
    // Check target audience
    if (alert.targetAudience === "all") return true;
    if (alert.targetAudience === "zone-leaders" && user?.role === "zone-leader") return true;
    if (alert.targetAudience === "area-leaders" && user?.role === "area-leader") return true;
    if (alert.targetAudience === "cell-leaders" && user?.role === "cell-leader") return true;
    
    return false;
  });

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Logo size="md" className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Home Cell Portal</h1>
                <p className="text-xs text-muted-foreground">Victory Bible Church Intl</p>
              </div>
            </div>
          </div>

          {/* Right side - Theme toggle and user info */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle - always visible */}
            <ThemeToggle />
            
            {/* User info - only show if logged in */}
            {user && (
              <>
                {/* Alert Notifications */}
                {relevantAlerts.length > 0 && (
                  <div className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    >
                      {relevantAlerts.length}
                    </Badge>
                  </div>
                )}
                
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role.replace('-', ' ')}</p>
                </div>
                
                {/* Logout Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};