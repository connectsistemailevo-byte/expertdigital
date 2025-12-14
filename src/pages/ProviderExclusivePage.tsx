import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/contexts/LocationContext';
import RequestPanel from '@/components/RequestPanel';
import LiveTrackingMap from '@/components/LiveTrackingMap';
import { Loader2, MapPin, Phone, AlertCircle, CheckCircle, Clock, DollarSign, Truck, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProviderData {
  id: string;
  name: string;
  whatsapp: string;
  address: string | null;
  region: string | null;
  slug: string;
  latitude: number;
  longitude: number;
  base_price: number | null;
  price_per_km: number | null;
  has_patins: boolean;
  patins_extra_price: number | null;
  service_types: string[];
  state_uf: string | null;
}

interface OnlineStatus {
  is_online: boolean;
  latitude: number;
  longitude: number;
  last_seen_at: string;
}

interface CustomizationData {
  company_name: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

// Função para calcular distância usando Haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ProviderExclusivePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { location } = useLocation();
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus | null>(null);
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
        // Buscar provider pelo slug com todas as informações
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

        // Buscar status online
        const { data: statusData } = await supabase
          .from('provider_online_status')
          .select('*')
          .eq('provider_id', providerData.id)
          .maybeSingle();

        if (statusData) {
          setOnlineStatus(statusData);
        }

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
            primary_color: customData.primary_color || '#22c55e',
            secondary_color: customData.secondary_color || '#16a34a',
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

  // Calcular distância e tempo estimado
  const providerMetrics = useMemo(() => {
    if (!provider || !location.latitude || !location.longitude) {
      return { distance: 0, estimatedTime: 0 };
    }

    const providerLat = onlineStatus?.latitude || provider.latitude;
    const providerLng = onlineStatus?.longitude || provider.longitude;

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      providerLat,
      providerLng
    );

    // Estimativa: 40km/h de velocidade média
    const estimatedTime = Math.ceil((distance / 40) * 60);

    return { distance, estimatedTime };
  }, [provider, onlineStatus, location]);

  // Verificar se está online (is_online ou last_seen nos últimos 30 min)
  const isProviderOnline = useMemo(() => {
    if (!onlineStatus) return false;
    if (onlineStatus.is_online) return true;
    
    const lastSeen = new Date(onlineStatus.last_seen_at);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return lastSeen > thirtyMinutesAgo;
  }, [onlineStatus]);

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
  const primaryColor = customization?.primary_color || '#22c55e';
  const basePrice = provider.base_price ?? 50;
  const pricePerKm = provider.price_per_km ?? 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header com branding personalizado */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-3">
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
              href={`https://wa.me/55${provider.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 bg-green-600 hover:bg-green-700"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-4">
        
        {/* Card do Prestador - Estilo similar ao da imagem */}
        <div className="mb-4 p-4 rounded-2xl bg-white border-2 border-yellow-400 shadow-lg">
          <div className="flex items-start gap-3">
            {/* Avatar/Icon do prestador */}
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Truck className="w-6 h-6" />
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
                <Badge variant="outline" className="bg-pink-100 text-pink-700 border-pink-200 text-xs">
                  R${basePrice} + R${pricePerKm.toFixed(2)}/km
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${isProviderOnline 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                >
                  {isProviderOnline ? 'Disponível' : 'Indisponível'}
                </Badge>
              </div>

              {/* Distância e tempo */}
              <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                {providerMetrics.distance > 0 && (
                  <>
                    <span className="flex items-center gap-1">
                      <Navigation className="w-4 h-4 text-slate-400" />
                      {providerMetrics.distance.toFixed(1)} km de você
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      ~{providerMetrics.estimatedTime} min
                    </span>
                  </>
                )}
              </div>

              {/* Botão de calcular valor */}
              <div className="bg-purple-100 text-purple-700 rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium">
                <Truck className="w-4 h-4" />
                Informe o destino para ver o valor
              </div>

              {/* Tags de serviços */}
              <div className="flex flex-wrap gap-2 mt-3">
                {provider.has_patins && (
                  <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 border-cyan-200">
                    Patins
                  </Badge>
                )}
                {provider.service_types?.includes('guincho_completo') && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                    Completo
                  </Badge>
                )}
                {provider.service_types?.includes('guincho_basico') && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                    Básico
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mapa do prestador */}
        <div className="mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="relative w-full h-[200px] md:h-[280px] rounded-xl overflow-hidden">
            <LiveTrackingMap className="w-full h-full" />
          </div>
          
          {/* Legenda compacta */}
          <div className="flex flex-wrap justify-center items-center gap-4 mt-3 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Você</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>{displayName}</span>
            </div>
          </div>
        </div>

        {/* Painel de solicitação */}
        <RequestPanel 
          filterProviderId={provider.id}
          hideProviderSelection={true}
        />
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-500 text-xs">
        <p>© {new Date().getFullYear()} {displayName} • Atendimento 24h</p>
      </footer>
    </div>
  );
};

export default ProviderExclusivePage;
