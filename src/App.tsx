import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import CellDashboard from "./pages/CellDashboard";
import MeetingFormPage from "./pages/MeetingFormPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ZoneLeaderDashboard from "./pages/ZoneLeaderDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<CellDashboard />} />
          <Route path="/meeting-form" element={<MeetingFormPage />} />
          <Route path="/admin" element={<SuperAdminDashboard />} />
          <Route path="/zone-dashboard" element={<ZoneLeaderDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
