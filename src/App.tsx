import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocationProvider } from "@/contexts/LocationContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import { ProviderAutoTracking } from "@/components/ProviderAutoTracking";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderPage from "./pages/ProviderPage";
import ProviderExclusivePage from "./pages/ProviderExclusivePage";
import ProviderStats from "./pages/ProviderStats";
import AdminPanel from "./pages/AdminPanel";
import ProviderTracking from "./pages/ProviderTracking";
import InstalarPWA from "./pages/InstalarPWA";
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

  // Todas as rotas disponíveis - tracking e pwa são globais
  return (
    <Routes>
      {/* PWA Installation route - prioridade máxima */}
      <Route path="/instalar" element={<InstalarPWA />} />

      {/* Tracking routes - SEMPRE disponível */}
      <Route path="/tracking" element={<ProviderTracking />} />
      <Route path="/rastreamento" element={<ProviderTracking />} />

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
          <Route path="/provider-stats" element={<ProviderStats />} />
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
            {/* Auto tracking (only if provider enabled it before) */}
            <ProviderAutoTracking />
            <TenantRouter />
          </BrowserRouter>
        </LocationProvider>
      </TenantProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
