import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, X, Check, Loader2, Navigation, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProviderFloatingTrackerProps {
  providerId: string;
  providerName: string;
  onClose?: () => void;
}

type TrackingStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

export const ProviderFloatingTracker: React.FC<ProviderFloatingTrackerProps> = ({
  providerId,
  providerName,
  onClose
}) => {
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [minimized, setMinimized] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const currentPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  // Enviar localização para o backend
  const sendLocation = useCallback(async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('atualizar-localizacao-prestador', {
        body: {
          prestadorId: providerId,
          latitude: lat,
          longitude: lng
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        setCoords({ lat, lng });
        setLastUpdate(new Date());
        setUpdateCount(prev => prev + 1);
        return true;
      }
      return false;
    } catch (e) {
      console.error('[FloatingTracker] Error sending location:', e);
      return false;
    }
  }, [providerId]);

  // Enviar status offline
  const sendOffline = useCallback(async () => {
    try {
      await supabase.functions.invoke('atualizar-localizacao-prestador', {
        body: {
          prestadorId: providerId,
          offline: true
        }
      });
      console.log('[FloatingTracker] Sent offline status');
    } catch (e) {
      console.error('[FloatingTracker] Error sending offline:', e);
    }
  }, [providerId]);

  // Iniciar rastreamento
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('GPS não suportado neste navegador');
      return;
    }

    setStatus('requesting');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        currentPositionRef.current = { lat, lng };

        const success = await sendLocation(lat, lng);
        
        if (success) {
          setStatus('active');

          // Iniciar watch contínuo
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              currentPositionRef.current = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              };
            },
            (err) => {
              console.error('[FloatingTracker] Watch error:', err);
            },
            { 
              enableHighAccuracy: true, 
              maximumAge: 5000,
              timeout: 30000
            }
          );

          // Enviar atualizações a cada 10 segundos
          intervalIdRef.current = setInterval(() => {
            if (currentPositionRef.current) {
              sendLocation(currentPositionRef.current.lat, currentPositionRef.current.lng);
            }
          }, 10000);
        } else {
          setStatus('error');
          setError('Erro ao enviar localização inicial');
        }
      },
      (geoError) => {
        console.error('[FloatingTracker] GPS Error:', geoError);
        
        if (geoError.code === 1) {
          setStatus('denied');
          setError('Permissão de localização negada');
        } else if (geoError.code === 2) {
          setStatus('error');
          setError('GPS indisponível');
        } else {
          setStatus('error');
          setError('Erro ao obter localização');
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 20000, 
        maximumAge: 0 
      }
    );
  }, [sendLocation]);

  // Parar rastreamento
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    sendOffline();
    setStatus('idle');
    setCoords(null);
    setUpdateCount(0);
    onClose?.();
  }, [sendOffline, onClose]);

  // Auto-iniciar quando montar
  useEffect(() => {
    if (status === 'idle') {
      startTracking();
    }
  }, []);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  // Versão minimizada
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className={`fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 ${
          status === 'active' 
            ? 'bg-green-500 animate-pulse' 
            : status === 'denied' || status === 'error'
            ? 'bg-red-500'
            : 'bg-blue-500'
        }`}
      >
        {status === 'active' ? (
          <Check className="w-6 h-6 text-white" />
        ) : status === 'requesting' ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <MapPin className="w-6 h-6 text-white" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-sm font-medium text-white truncate max-w-[150px]">{providerName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setMinimized(true)}
            className="p-1 hover:bg-slate-700 rounded"
          >
            <div className="w-4 h-0.5 bg-slate-400" />
          </button>
          <button 
            onClick={stopTracking}
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {status === 'requesting' && (
          <div className="text-center">
            <Loader2 className="w-10 h-10 mx-auto mb-2 text-blue-400 animate-spin" />
            <p className="text-sm text-white">Solicitando permissão...</p>
            <p className="text-xs text-slate-400">Clique em "Permitir"</p>
          </div>
        )}

        {status === 'active' && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-bold">ONLINE</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              Rastreamento ativo • {updateCount} atualizações
            </p>
            {lastUpdate && (
              <p className="text-xs text-slate-500">
                Última: {lastUpdate.toLocaleTimeString('pt-BR')}
              </p>
            )}
            <Button
              onClick={stopTracking}
              variant="destructive"
              size="sm"
              className="w-full mt-3"
            >
              Desativar
            </Button>
          </div>
        )}

        {status === 'denied' && (
          <div className="text-center">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-400" />
            <p className="text-sm text-red-400 font-medium mb-1">Permissão Negada</p>
            <p className="text-xs text-slate-400 mb-3">{error}</p>
            <Button
              onClick={startTracking}
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-yellow-400" />
            <p className="text-sm text-yellow-400 font-medium mb-1">Erro</p>
            <p className="text-xs text-slate-400 mb-3">{error}</p>
            <Button
              onClick={startTracking}
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        )}

        {status === 'idle' && (
          <div className="text-center">
            <MapPin className="w-10 h-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-white mb-3">Iniciar rastreamento</p>
            <Button
              onClick={startTracking}
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Ativar Localização
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderFloatingTracker;
