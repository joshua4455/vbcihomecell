import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import Index from "./pages/Index";
import Login from "./pages/Login";
import CellDashboard from "./pages/CellDashboard";
import MeetingFormPage from "./pages/MeetingFormPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ZoneLeaderDashboard from "./pages/ZoneLeaderDashboard";
import AreaLeaderDashboard from "./pages/AreaLeaderDashboard";
import NotFound from "./pages/NotFound";
import SetNewPassword from "./pages/SetNewPassword";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange={false}
  >
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // In production, send to error reporting service
        console.error('Application Error:', error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataProvider>
            <TooltipProvider>
              <SessionTimeoutWarning />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/set-password" element={<SetNewPassword />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ErrorBoundary>
                        <ProtectedRoute requiredRole="cell-leader">
                          <CellDashboard />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="/meeting-form" 
                    element={
                      <ErrorBoundary>
                        <ProtectedRoute requiredRole="cell-leader">
                          <MeetingFormPage />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <ErrorBoundary>
                        <ProtectedRoute requiredRole="super-admin">
                          <SuperAdminDashboard />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="/zone-dashboard" 
                    element={
                      <ErrorBoundary>
                        <ProtectedRoute requiredRole="zone-leader">
                          <ZoneLeaderDashboard />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } 
                  />
                  <Route 
                    path="/area-dashboard" 
                    element={
                      <ErrorBoundary>
                        <ProtectedRoute requiredRole="area-leader">
                          <AreaLeaderDashboard />
                        </ProtectedRoute>
                      </ErrorBoundary>
                    } 
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </DataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </ThemeProvider>
);

export default App;
