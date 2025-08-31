import { Church, Users, BarChart3, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Navigation = () => {
  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Church className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Priesthood Portal</h1>
                <p className="text-xs text-muted-foreground">Cell Management System</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" className="text-primary hover:bg-primary/10">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
              <Users className="mr-2 h-4 w-4" />
              Members
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
              <Church className="mr-2 h-4 w-4" />
              Zones
            </Button>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-accent text-accent-foreground">
                3
              </Badge>
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5" />
            </Button>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">Pastor Johnson</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <Avatar className="h-9 w-9">
                <AvatarImage src="/placeholder-avatar.jpg" alt="Pastor Johnson" />
                <AvatarFallback className="bg-primary text-primary-foreground">PJ</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};