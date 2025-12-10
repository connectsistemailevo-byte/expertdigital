import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useLocation } from '@/contexts/LocationContext';
import RequestPanel from '@/components/RequestPanel';
import { Loader2, MapPin, Phone } from 'lucide-react';
import { useProviders } from '@/hooks/useProviders';

const ProviderPage: React.FC = () => {
  const tenant = useTenant();
  const { location } = useLocation();
  const { providers } = useProviders();

  // Encontra o provider específico deste tenant
  const tenantProvider = providers.find(p => p.id === tenant.providerId);

  if (tenant.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant.isWhiteLabel || !tenant.providerId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Prestador não encontrado
          </h1>
          <p className="text-muted-foreground">
            O domínio acessado não está configurado para nenhum prestador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header com branding personalizado */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tenant.logoUrl ? (
                <img 
                  src={tenant.logoUrl} 
                  alt={tenant.companyName || 'Logo'} 
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  {(tenant.companyName || tenant.providerName || 'P').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-white">
                  {tenant.companyName || tenant.providerName}
                </h1>
                <p className="text-xs text-slate-400">Serviços de Guincho</p>
              </div>
            </div>

            {tenantProvider && (
              <a
                href={`https://wa.me/${tenantProvider.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
                style={{ backgroundColor: tenant.primaryColor }}
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Contato</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6">
        {/* Info do prestador */}
        {tenantProvider && (
          <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-slate-300">{tenantProvider.address}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Região: {tenantProvider.region}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Painel de solicitação - mostra apenas este prestador */}
        <RequestPanel 
          filterProviderId={tenant.providerId}
          hideProviderSelection={true}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} {tenant.companyName || tenant.providerName}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default ProviderPage;
