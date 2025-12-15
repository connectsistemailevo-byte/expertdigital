import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Navigation, CheckCircle2, XCircle, AlertTriangle, 
  Phone, Search, Smartphone, Globe, Clock, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBackgroundTracking } from '@/hooks/useBackgroundTracking';

const PROVIDER_STORAGE_KEY = 'showtime_provider_data';

// Phone mask function
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

const ProviderTracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  const urlProviderId = searchParams.get('id');
  const urlProviderName = searchParams.get('name');
  
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string>('Prestador');
  const [isLoading, setIsLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Use the background tracking hook
  const {
    isTracking,
    isPWA,
    coords,
    lastUpdate,
    updateCount,
    error: trackingError,
    status,
    startTracking,
    stopTracking
  } = useBackgroundTracking({ providerId });

  // Load provider data on mount
  useEffect(() => {
    const loadProviderData = async () => {
      if (urlProviderId) {
        setProviderId(urlProviderId);
        setProviderName(urlProviderName || 'Prestador');
        localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify({
          id: urlProviderId,
          name: urlProviderName || 'Prestador'
        }));
        setIsLoading(false);
        return;
      }

      const storedData = localStorage.getItem(PROVIDER_STORAGE_KEY);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (parsedData?.id) {
            setProviderId(parsedData.id);
            setProviderName(parsedData.name || 'Prestador');
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing stored data:', e);
        }
      }

      setIsLoading(false);
    };

    loadProviderData();
  }, [urlProviderId, urlProviderName]);

  // Handle phone input with mask
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhoneInput(formatted);
    setPhoneError('');
  };

  // Search provider by phone number
  const searchProviderByPhone = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      setPhoneError('Digite um número de telefone válido com DDD');
      return;
    }

    setIsSearching(true);
    setPhoneError('');

    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, name, whatsapp');

      if (error) throw error;

      const provider = data?.find(p => {
        const cleanStoredPhone = p.whatsapp.replace(/\D/g, '');
        return cleanStoredPhone === cleanPhone || 
               cleanStoredPhone.slice(-9) === cleanPhone.slice(-9) ||
               cleanStoredPhone.slice(-10) === cleanPhone.slice(-10) ||
               cleanStoredPhone.slice(-11) === cleanPhone;
      });

      if (provider) {
        setProviderId(provider.id);
        setProviderName(provider.name);
        localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify({
          id: provider.id,
          name: provider.name
        }));
      } else {
        setPhoneError('Prestador não encontrado. Verifique o número ou cadastre-se primeiro.');
      }
    } catch (e) {
      console.error('Error searching provider:', e);
      setPhoneError('Erro ao buscar prestador. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-start when page loads and it's a PWA
  useEffect(() => {
    if (providerId && status === 'idle' && isPWA) {
      const timer = setTimeout(() => {
        startTracking();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [providerId, status, isPWA, startTracking]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Show phone search form if no provider ID
  if (!providerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Identificação</h1>
            <p className="text-white/70 text-sm">
              Digite seu WhatsApp cadastrado para acessar o rastreamento
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                type="tel"
                placeholder="(00) 00000-0000"
                value={phoneInput}
                onChange={handlePhoneChange}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-center text-lg"
                maxLength={15}
              />
              {phoneError && (
                <p className="text-red-400 text-sm mt-2 text-center">{phoneError}</p>
              )}
            </div>

            <Button
              onClick={searchProviderByPhone}
              disabled={isSearching || phoneInput.replace(/\D/g, '').length < 10}
              className="w-full bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </div>

          <p className="text-white/40 text-xs text-center mt-6">
            Use o mesmo número cadastrado como prestador
          </p>
        </div>
      </div>
    );
  }

  // Not PWA - show install message
  if (!isPWA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 max-w-sm w-full text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-xl font-bold text-white mb-2">Instale o App</h1>
          <p className="text-green-400 text-lg mb-4">{decodeURIComponent(providerName)}</p>
          
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <Globe className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <p className="text-yellow-200 text-sm mb-2">
              <strong>Você está acessando pelo navegador</strong>
            </p>
            <p className="text-white/70 text-xs">
              Para o rastreamento funcionar em segundo plano, você precisa instalar o app (PWA).
            </p>
          </div>

          <div className="text-left bg-white/5 rounded-lg p-4 mb-6">
            <p className="text-white/80 text-sm font-medium mb-3">Como instalar:</p>
            <ol className="text-white/60 text-xs space-y-2 list-decimal list-inside">
              <li>Toque no menu do navegador (⋮ ou ⋯)</li>
              <li>Selecione "Instalar app" ou "Adicionar à tela inicial"</li>
              <li>Abra o app instalado e entre novamente</li>
            </ol>
          </div>

          <Button 
            onClick={() => window.location.href = '/instalar-pwa'}
            className="w-full bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            <Smartphone className="w-5 h-5 mr-2" />
            Ver Instruções de Instalação
          </Button>

          <p className="text-white/40 text-xs mt-4">
            O rastreamento GPS só funciona no app instalado
          </p>
        </div>
      </div>
    );
  }

  // PWA mode - show tracking interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 max-w-sm w-full text-center">
        <div className="text-4xl mb-2">🚗</div>
        <h1 className="text-xl font-bold text-white mb-1">Rastreamento GPS</h1>
        <p className="text-green-400 text-lg mb-6">{decodeURIComponent(providerName)}</p>

        {/* PWA Badge */}
        <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs mb-6">
          <Smartphone className="w-3 h-3" />
          Modo App (PWA)
        </div>

        {/* Status Display */}
        <div className="mb-6">
          {status === 'idle' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <Navigation className="w-8 h-8 text-white/60" />
              </div>
              <p className="text-white/80">Rastreamento desativado</p>
              <p className="text-white/50 text-sm mt-2">
                Clique no botão abaixo para ativar
              </p>
            </>
          )}

          {status === 'requesting' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-green-400 animate-spin" />
              <p className="text-white animate-pulse">Solicitando permissão de GPS...</p>
              <p className="text-white/60 text-sm mt-2">
                Clique em "Permitir" quando o navegador solicitar
              </p>
            </>
          )}

          {status === 'active' && (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <p className="text-green-400 text-lg font-bold">RASTREAMENTO ATIVO</p>
              <p className="text-white/60 text-sm mt-2">
                Você pode minimizar ou usar outros apps. O rastreamento continua.
              </p>
              
              {coords && (
                <div className="mt-4 bg-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 text-white/60 text-xs mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>Última localização</span>
                  </div>
                  <p className="text-white/40 text-xs font-mono">
                    Lat: {coords.lat.toFixed(6)} | Lng: {coords.lng.toFixed(6)}
                  </p>
                  {lastUpdate && (
                    <div className="flex items-center justify-center gap-1 text-white/40 text-xs mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{lastUpdate.toLocaleTimeString('pt-BR')}</span>
                    </div>
                  )}
                  <p className="text-green-400/60 text-xs mt-2">
                    Atualizações: {updateCount}
                  </p>
                </div>
              )}
            </>
          )}

          {status === 'denied' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <p className="text-red-400 text-lg font-bold mb-2">Permissão Negada</p>
              <p className="text-white/60 text-sm">{trackingError}</p>
              <div className="mt-4 p-3 bg-white/5 rounded-lg text-left">
                <p className="text-white/80 text-xs font-medium mb-2">Como permitir:</p>
                <ol className="text-white/60 text-xs space-y-1 list-decimal list-inside">
                  <li>Abra as configurações do app</li>
                  <li>Vá em "Permissões" ou "Localização"</li>
                  <li>Permita acesso à localização</li>
                  <li>Volte e clique no botão abaixo</li>
                </ol>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <p className="text-yellow-400 text-lg font-bold mb-2">Erro</p>
              <p className="text-white/60 text-sm">{trackingError}</p>
            </>
          )}

          {status === 'unavailable' && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <p className="text-red-400 text-lg font-bold mb-2">GPS Indisponível</p>
              <p className="text-white/60 text-sm">{trackingError}</p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'active' && (
            <Button 
              onClick={stopTracking}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              Desativar Rastreamento
            </Button>
          )}

          {(status === 'denied' || status === 'error') && (
            <Button 
              onClick={startTracking}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Navigation className="w-5 h-5 mr-2" />
              Tentar Novamente
            </Button>
          )}

          {status === 'idle' && (
            <Button 
              onClick={startTracking}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Navigation className="w-5 h-5 mr-2" />
              Ativar Rastreamento
            </Button>
          )}
        </div>

        {/* Background info */}
        {status === 'active' && (
          <div className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400/80 text-xs">
              ✓ Rastreamento continua em segundo plano
            </p>
            <p className="text-white/50 text-xs mt-1">
              Para ficar offline, clique em "Desativar Rastreamento"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderTracking;
