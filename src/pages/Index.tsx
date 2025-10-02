import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Heart,
  Shield,
  Zap,
  LogOut
} from "lucide-react";
import { Logo } from "@/components/Logo";

const Index = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { areas, cells, meetings, zones } = useData();

  // Calculate platform statistics
  const totalAreas = areas.length;
  const totalCells = cells.length;
  const totalMembers = cells.reduce((sum, cell) => sum + (cell.members?.length || 0), 0);
  const totalMeetings = meetings.length;

  if (user) {
    // Check if user has proper assignments before redirecting
    const hasAssignment = () => {
      switch (user.role) {
        case 'super-admin':
          return true; // Super admin always has access
        case 'zone-leader':
          return zones.some(zone => zone.leader?.id === user.id);
        case 'area-leader':
          return areas.some(area => area.leader?.id === user.id);
        case 'cell-leader':
          return cells.some(cell => cell.leader?.id === user.id);
        default:
          return false;
      }
    };

    // If user has assignment, redirect to appropriate dashboard
    if (hasAssignment()) {
      const redirectToDashboard = () => {
        switch (user.role) {
          case 'super-admin':
            navigate('/admin');
            break;
          case 'zone-leader':
            navigate('/zone-dashboard');
            break;
          case 'area-leader':
            navigate('/area-dashboard');
            break;
          case 'cell-leader':
            navigate('/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      };

      // Auto-redirect immediately
      setTimeout(redirectToDashboard, 100);

      return (
        <div className="min-h-screen bg-gradient-subtle">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-4">
                Welcome back, {user.name}!
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                Redirecting to your {user.role.replace('-', ' ')} dashboard...
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="mb-4"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // If user has no assignment, show welcome page with manual navigation
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              You don't have a {user.role.replace('-', ' ')} assignment yet. Please contact your administrator or choose a dashboard below.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="mb-4"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/dashboard")}>
              <CardContent>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Cell Dashboard</h3>
                <p className="text-muted-foreground">Manage your home cell</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/area-dashboard")}>
              <CardContent>
                <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Area Dashboard</h3>
                <p className="text-muted-foreground">Manage your area</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin")}>
              <CardContent>
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Admin Dashboard</h3>
                <p className="text-muted-foreground">System administration</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Logo size="lg" className="text-primary" />
                </div>
                <Badge variant="secondary" className="text-sm">Victory Bible Church Intl</Badge>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Empowering Our
                <span className="text-primary block">Church Home Cells</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Streamline home cell management, track spiritual growth, and build stronger communities 
                with our comprehensive church management platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  className="bg-gradient-primary text-lg px-8 py-6"
                  onClick={() => navigate("/login")}
                >
                  Login to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8 py-6"
                  onClick={() => {
                    // Clear any stored session data
                    localStorage.removeItem('gospel-gather-user');
                    window.location.reload();
                  }}
                >
                  Clear Session
                </Button>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/images.jpeg" 
                  alt="Church Community Celebration" 
                  className="w-full h-auto object-cover"
                />
              </div>
              
              {/* Floating Stats Cards */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{totalMembers}+ Members</p>
                    <p className="text-xs text-muted-foreground">Active Community</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-6 -right-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{totalMeetings}+ Meetings</p>
                    <p className="text-xs text-muted-foreground">This Month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Church Heritage Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Our Church Heritage</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Celebrating decades of faithful service and community building in the Gospel
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-xl">
                <h3 className="text-2xl font-bold text-foreground mb-4">40 Years of Ministry</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our church has been a beacon of hope and spiritual growth for four decades. 
                  Through faithful leadership and dedicated community service, we've built a 
                  strong foundation of faith that continues to impact lives.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-primary">Founded</h4>
                  <p className="text-2xl font-bold">1983</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-primary">Legacy</h4>
                  <p className="text-2xl font-bold">40+ Years</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="/dd6df0_b8a8f1a62e4e4ddb95515f74162362a7~mv2.avif" 
                alt="Church Heritage" 
                className="w-full h-auto rounded-xl shadow-lg"
                onError={(e) => {
                  // Fallback if AVIF format is not supported
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Platform Overview</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real-time insights into our growing church community and active ministry
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">{totalAreas}</h3>
              <p className="text-muted-foreground font-medium">Active Areas</p>
              <p className="text-sm text-muted-foreground mt-1">Across the region</p>
            </div>
            
            <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-6 text-center">
              <div className="bg-secondary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Logo size="lg" className="text-secondary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">{totalCells}</h3>
              <p className="text-muted-foreground font-medium">Home Cells</p>
              <p className="text-sm text-muted-foreground mt-1">Growing communities</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-6 text-center">
              <div className="bg-green-500/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">{totalMembers}</h3>
              <p className="text-muted-foreground font-medium">Active Members</p>
              <p className="text-sm text-muted-foreground mt-1">Faithful community</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl p-6 text-center">
              <div className="bg-orange-500/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">{totalMeetings}</h3>
              <p className="text-muted-foreground font-medium">Monthly Meetings</p>
              <p className="text-sm text-muted-foreground mt-1">Regular gatherings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Gospel Gather?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform is designed specifically for church leaders to manage their home cells 
              efficiently and focus on what matters most - building community and spiritual growth.
            </p>
              </div>
              
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your church data is protected with industry-standard security measures and 
                role-based access control.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-secondary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-secondary" />
                      </div>
              <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Built with modern web technologies for instant loading and smooth user experience.
              </p>
                    </div>
            
            <div className="text-center p-6">
              <div className="bg-green-500/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              <h3 className="text-xl font-semibold mb-3">Growth Analytics</h3>
              <p className="text-muted-foreground">
                Track attendance, offerings, and spiritual growth with comprehensive reporting tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Logo size="md" className="text-primary" />
            <span className="text-xl font-semibold">Home Cell Portal</span>
          </div>
          <p className="text-muted-foreground mb-4">
            Victory Bible Church International - Empowering Home Cell Communities
          </p>
          <p className="text-sm text-muted-foreground">
            2024 Home Cell Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;