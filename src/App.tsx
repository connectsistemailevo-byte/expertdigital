import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocationProvider } from "@/contexts/LocationContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderPage from "./pages/ProviderPage";
import ProviderExclusivePage from "./pages/ProviderExclusivePage";
import AdminPanel from "./pages/AdminPanel";
import ProviderTracking from "./pages/ProviderTracking";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Componente que decide qual página mostrar baseado no tenant
const TenantRouter = () => {
  const tenant = useTenant();

  // Loading state
  if (tenant.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Todas as rotas disponíveis - tracking é global para todos
  return (
    <Routes>
      {/* Tracking route - SEMPRE disponível, prioridade máxima */}
      <Route path="/tracking" element={<ProviderTracking />} />
      
      {/* White-label routes */}
      {tenant.isWhiteLabel ? (
        <>
          <Route path="/" element={<ProviderPage />} />
          <Route path="*" element={<ProviderPage />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Index />} />
          <Route path="/p/:slug" element={<ProviderExclusivePage />} />
          <Route path="/provider-dashboard" element={<ProviderDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TenantProvider>
        <LocationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <TenantRouter />
          </BrowserRouter>
        </LocationProvider>
      </TenantProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
