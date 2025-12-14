import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/contexts/LocationContext';
import RequestPanel from '@/components/RequestPanel';
import { Loader2, MapPin, Phone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProviderData {
  id: string;
  name: string;
  whatsapp: string;
  address: string | null;
  region: string | null;
  slug: string;
  latitude: number;
  longitude: number;
}

interface CustomizationData {
  company_name: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

const ProviderExclusivePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { location } = useLocation();
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [customization, setCustomization] = useState<CustomizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProvider() {
      if (!slug) {
        setError('Link inválido');
        setLoading(false);
        return;
      }

      try {
        // Buscar provider pelo slug
        const { data: providerData, error: providerError } = await supabase
          .from('providers')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (providerError) throw providerError;

        if (!providerData) {
          setError('Prestador não encontrado');
          setLoading(false);
          return;
        }

        setProvider(providerData);

        // Buscar customização
        const { data: customData } = await supabase
          .from('provider_customization')
          .select('*')
          .eq('provider_id', providerData.id)
          .maybeSingle();

        if (customData) {
          setCustomization({
            company_name: customData.company_name,
            logo_url: customData.logo_url,
            primary_color: customData.primary_color || '#6366f1',
            secondary_color: customData.secondary_color || '#8b5cf6',
          });
        }
      } catch (err: any) {
        console.error('Erro ao carregar prestador:', err);
        setError('Erro ao carregar prestador');
      } finally {
        setLoading(false);
      }
    }

    loadProvider();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || 'Prestador não encontrado'}
          </h1>
          <p className="text-muted-foreground mb-6">
            O link que você acessou não está disponível ou não existe.
          </p>
          <Button onClick={() => navigate('/')}>
            Ir para página principal
          </Button>
        </div>
      </div>
    );
  }

  const displayName = customization?.company_name || provider.name;
  const primaryColor = customization?.primary_color || '#6366f1';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header com branding personalizado */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {customization?.logo_url ? (
                <img 
                  src={customization.logo_url} 
                  alt={displayName} 
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-white">
                  {displayName}
                </h1>
                <p className="text-xs text-slate-400">Serviços de Guincho</p>
              </div>
            </div>

            <a
              href={`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Contato</span>
            </a>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6">
        {/* Info do prestador */}
        <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-slate-300">{provider.address || 'Endereço não informado'}</p>
              <p className="text-xs text-slate-500 mt-1">
                Região: {provider.region || 'Não informada'}
              </p>
            </div>
          </div>
        </div>

        {/* Painel de solicitação - mostra apenas este prestador */}
        <RequestPanel 
          filterProviderId={provider.id}
          hideProviderSelection={true}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} {displayName}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default ProviderExclusivePage;
