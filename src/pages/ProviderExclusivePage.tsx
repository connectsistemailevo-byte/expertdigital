import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/contexts/LocationContext';
import RequestPanel from '@/components/RequestPanel';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, MapPin, Phone, AlertCircle, CheckCircle, Clock, DollarSign, Truck, Navigation, RotateCcw, Download, Route } from 'lucide-react';
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
  return_price: number | null;
  return_price_per_km: number | null;
  return_enabled: boolean;
  hide_prices: boolean;
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

// Componente de mapa exclusivo para mostrar apenas o prestador específico
interface ExclusiveProviderMapProps {
  provider: ProviderData;
  onlineStatus: OnlineStatus | null;
  clientLocation: { latitude: number; longitude: number };
}

const ExclusiveProviderMap: React.FC<ExclusiveProviderMapProps> = ({ provider, onlineStatus, clientLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { mapboxToken } = useLocation();

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const providerLat = onlineStatus?.latitude || provider.latitude;
    const providerLng = onlineStatus?.longitude || provider.longitude;

    // Centro entre cliente e prestador
    const centerLat = (clientLocation.latitude + providerLat) / 2;
    const centerLng = (clientLocation.longitude + providerLng) / 2;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: [centerLng, centerLat],
      zoom: 12,
      pitch: 30,
      attributionControl: false,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Marcador do cliente (azul)
      const clientEl = document.createElement('div');
      clientEl.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      `;
      new mapboxgl.Marker({ element: clientEl })
        .setLngLat([clientLocation.longitude, clientLocation.latitude])
        .addTo(map.current!);

      // Marcador do prestador (verde)
      const providerEl = document.createElement('div');
      providerEl.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div style="
            background: rgba(10, 15, 26, 0.95);
            color: white;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 11px;
            margin-bottom: 4px;
            border: 1px solid rgba(34, 197, 94, 0.5);
            text-align: center;
          ">
            <span style="
              display: inline-flex;
              align-items: center;
              gap: 3px;
              background: #22c55e;
              color: white;
              padding: 2px 6px;
              border-radius: 10px;
              font-size: 9px;
              font-weight: 700;
            ">
              <span style="width: 5px; height: 5px; background: white; border-radius: 50%;"></span>
              ONLINE
            </span>
            <div style="color: #f59e0b; font-weight: 700; font-size: 12px; margin-top: 2px;">${provider.name}</div>
          </div>
          <div style="
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 15px rgba(34, 197, 94, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M10 17h4V5H2v12h3m5 0a3 3 0 1 0 6 0m-6 0h6"/>
              <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1m5 0a3 3 0 1 1-6 0"/>
            </svg>
          </div>
        </div>
      `;
      new mapboxgl.Marker({ element: providerEl, anchor: 'bottom' })
        .setLngLat([providerLng, providerLat])
        .addTo(map.current!);

      // Ajustar bounds para mostrar ambos os marcadores
      const bounds = new mapboxgl.LngLatBounds()
        .extend([clientLocation.longitude, clientLocation.latitude])
        .extend([providerLng, providerLat]);
      
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, provider, onlineStatus, clientLocation]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
        <span className="text-slate-500 text-sm">Carregando mapa...</span>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full" />;
};

// Componente para exibir as informações do prestador com preço calculado
interface ProviderInfoCardProps {
  provider: ProviderData;
  displayName: string;
  primaryColor: string;
  isProviderOnline: boolean;
  providerMetrics: { distance: number; estimatedTime: number };
  routeInfo: { distanceKm: number; loading: boolean } | null;
  hidePrices: boolean;
}

const ProviderInfoCard: React.FC<ProviderInfoCardProps> = ({
  provider,
  displayName,
  primaryColor,
  isProviderOnline,
  providerMetrics,
  routeInfo,
  hidePrices
}) => {
  const basePrice = provider.base_price ?? 50;
  const pricePerKm = provider.price_per_km ?? 5;
  const tripDistanceKm = routeInfo?.distanceKm || 0;
  const hasDestination = tripDistanceKm > 0;

  // Calcular preço total (ida)
  const totalPrice = basePrice + (tripDistanceKm * pricePerKm);
  
  // Calcular preço de retorno (se habilitado)
  const hasReturn = provider.return_enabled && (provider.return_price || provider.return_price_per_km);
  const returnTotalPrice = hasDestination && hasReturn
    ? (provider.return_price ?? 0) + (tripDistanceKm * (provider.return_price_per_km ?? 0))
    : 0;

  return (
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
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{displayName}</h2>
            {!hidePrices && (
              <Badge variant="outline" className="bg-pink-100 text-pink-700 border-pink-200 text-[10px] sm:text-xs">
                R${basePrice} + R${pricePerKm.toFixed(2)}/km
              </Badge>
            )}
            <Badge 
              variant="outline" 
              className={`text-[10px] sm:text-xs ${isProviderOnline 
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

          {/* Mostrar valor calculado ou mensagem para informar destino - só se não ocultar preços */}
          {!hidePrices && (
            <>
              {hasDestination ? (
                <div className="bg-green-100 text-green-800 rounded-lg px-3 py-2 text-sm font-medium">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="flex items-center gap-1">
                      <Route className="w-4 h-4" />
                      Trajeto: {tripDistanceKm.toFixed(1)} km
                    </span>
                    <span className="flex items-center gap-1 text-lg font-bold">
                      <DollarSign className="w-4 h-4" />
                      R$ {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-purple-100 text-purple-700 rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium">
                  <Truck className="w-4 h-4" />
                  Informe o destino para ver o valor
                </div>
              )}
            </>
          )}

          {/* Valor de retorno - só exibe se ativado, prestador online, já tiver destino E não ocultar preços */}
          {!hidePrices && hasReturn && hasDestination && (
            <div className="bg-orange-100 text-orange-700 rounded-lg px-3 py-2 flex items-center justify-between text-sm font-medium mt-2">
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Retorno (ida e volta)
              </span>
              <span className="font-bold">+ R$ {returnTotalPrice.toFixed(2)}</span>
            </div>
          )}

          {/* Info de retorno disponível (sem valor até informar destino) */}
          {!hidePrices && hasReturn && !hasDestination && (
            <div className="bg-orange-50 text-orange-600 rounded-lg px-3 py-2 flex items-center gap-2 text-xs mt-2">
              <RotateCcw className="w-3 h-3" />
              <span>Serviço de retorno disponível</span>
            </div>
          )}

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
  );
};

const ProviderExclusivePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { location, routeInfo } = useLocation();
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus | null>(null);
  const [customization, setCustomization] = useState<CustomizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPWAPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPWAPrompt(false);
    }
    setDeferredPrompt(null);
  };

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

        // Salvar dados do prestador no localStorage para o PWA
        localStorage.setItem('exclusive_provider_data', JSON.stringify({
          id: providerData.id,
          name: providerData.name,
          slug: providerData.slug
        }));

        // Registrar escaneamento do QR Code
        try {
          await supabase.from('qr_code_scans').insert({
            provider_id: providerData.id,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null
          });
        } catch (scanError) {
          console.log('Erro ao registrar scan:', scanError);
        }
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
        <div className="container mx-auto px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Logo e nome */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {customization?.logo_url ? (
                <img 
                  src={customization.logo_url} 
                  alt={displayName} 
                  className="h-8 w-auto sm:h-10 object-contain shrink-0"
                />
              ) : (
                <div 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-white truncate">
                  {displayName}
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">Serviços de Guincho</p>
              </div>
            </div>

            {/* Status online + WhatsApp */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Badge de status */}
              <Badge 
                variant="outline" 
                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 ${isProviderOnline 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isProviderOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                {isProviderOnline ? 'Online' : 'Offline'}
              </Badge>

              {/* Botão WhatsApp */}
              <a
                href={`https://wa.me/55${provider.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-white transition-all hover:opacity-90 bg-green-600 hover:bg-green-700 text-sm"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-4">
        {/* Mapa do prestador - APENAS este prestador */}
        <div className="mb-4">
          <div className="relative w-full h-[360px] md:h-[420px] rounded-xl overflow-hidden">
            <ExclusiveProviderMap 
              provider={provider}
              onlineStatus={onlineStatus}
              clientLocation={location}
            />
          </div>
        </div>

        {/* Painel de solicitação */}
        <RequestPanel 
          filterProviderId={provider.id}
          hideProviderSelection={true}
          hidePrices={provider.hide_prices}
        />

        {/* PWA Install Prompt */}
        {showPWAPrompt && (
          <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm">Instale o App de {displayName}</h3>
                <p className="text-white/80 text-xs">Acesso rápido ao seu guincho de confiança</p>
              </div>
              <Button
                size="sm"
                className="bg-white text-green-700 hover:bg-white/90 shrink-0"
                onClick={handleInstallPWA}
              >
                Instalar
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-500 text-xs">
        <p>© {new Date().getFullYear()} {displayName} • Atendimento 24h</p>
      </footer>
    </div>
  );
};

export default ProviderExclusivePage;
