import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TrackingState = 'initial' | 'requesting' | 'active' | 'error' | 'denied';

export default function ProviderTracking() {
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get('id');
  const providerName = searchParams.get('name') || 'Prestador';
  
  const [state, setState] = useState<TrackingState>('initial');
  const [error, setError] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const sendLocation = useCallback(async (lat: number, lng: number) => {
    if (!providerId) return;
    
    try {
      console.log('[Tracking] Sending location:', lat, lng);
      
      const { data, error } = await supabase.functions.invoke('atualizar-localizacao-prestador', {
        body: {
          prestadorId: providerId,
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;
      
      console.log('[Tracking] Location sent successfully:', data);
      setCoords({ lat, lng });
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
      setState('active');
    } catch (err) {
      console.error('[Tracking] Error sending location:', err);
      // Don't change state on send error, just log it
    }
  }, [providerId]);

  const goOffline = useCallback(async () => {
    if (!providerId) return;
    
    try {
      console.log('[Tracking] Going offline');
      await supabase.functions.invoke('atualizar-localizacao-prestador', {
        body: {
          prestadorId: providerId,
          offline: true
        }
      });
    } catch (err) {
      console.error('[Tracking] Error going offline:', err);
    }
  }, [providerId]);

  const startWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        console.log('[Tracking] Watch position update:', position.coords);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        lastPositionRef.current = { lat, lng };
        sendLocation(lat, lng);
      },
      (error) => {
        console.error('[Tracking] Watch error:', error);
        // Only show error if we haven't successfully tracked yet
        if (state !== 'active') {
          setState('error');
          setError('GPS perdeu conexão');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 30000
      }
    );

    // Send location every 5 seconds
    intervalRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        console.log('[Tracking] Interval update');
        sendLocation(lastPositionRef.current.lat, lastPositionRef.current.lng);
      }
    }, 5000);
  }, [sendLocation, state]);

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setState('error');
      setError('GPS não disponível neste dispositivo');
      return;
    }

    setState('requesting');
    setError('');

    console.log('[Tracking] Requesting geolocation permission...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('[Tracking] Permission granted, got position:', position.coords);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        lastPositionRef.current = { lat, lng };
        sendLocation(lat, lng);
        startWatching();
      },
      (err) => {
        console.error('[Tracking] Geolocation error:', err);
        
        if (err.code === 1) { // PERMISSION_DENIED
          setState('denied');
          setError('Você precisa permitir o acesso à localização nas configurações do seu navegador');
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          setState('error');
          setError('Localização indisponível. Verifique se o GPS está ligado');
        } else if (err.code === 3) { // TIMEOUT
          setState('error');
          setError('Tempo esgotado ao obter localização. Tente novamente');
        } else {
          setState('error');
          setError('Erro ao obter localização');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000
      }
    );
  }, [sendLocation, startWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      goOffline();
    };
  }, [goOffline]);

  // Handle page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && lastPositionRef.current) {
        sendLocation(lastPositionRef.current.lat, lastPositionRef.current.lng);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sendLocation]);

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      goOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [goOffline]);

  if (!providerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h1 className="text-xl font-bold mb-2">Link Inválido</h1>
          <p className="text-slate-400">ID do prestador não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        {/* Icon */}
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300 ${
          state === 'active' 
            ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse' 
            : state === 'error' || state === 'denied'
              ? 'bg-gradient-to-br from-red-500 to-red-600'
              : state === 'requesting'
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 animate-pulse'
                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
        }`}>
          {state === 'active' ? (
            <CheckCircle2 className="w-10 h-10 text-white" />
          ) : state === 'requesting' ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : state === 'error' || state === 'denied' ? (
            <AlertCircle className="w-10 h-10 text-white" />
          ) : (
            <MapPin className="w-10 h-10 text-white" />
          )}
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold mb-2 ${
          state === 'active' 
            ? 'text-green-400' 
            : state === 'error' || state === 'denied'
              ? 'text-red-400'
              : state === 'requesting'
                ? 'text-amber-400'
                : 'text-white'
        }`}>
          {state === 'active' 
            ? 'Rastreamento Ativo' 
            : state === 'error'
              ? 'Erro no GPS'
              : state === 'denied'
                ? 'GPS Bloqueado'
                : state === 'requesting'
                  ? 'Aguardando Permissão...'
                  : 'Ativar Rastreamento'}
        </h1>

        {/* Provider name */}
        <p className="text-slate-400 mb-4">{providerName}</p>

        {/* Status */}
        {state === 'active' && coords && (
          <div className="space-y-3 mb-6">
            <div className="bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2 inline-block">
              <span className="text-green-400 text-sm font-medium">
                Atualizado às {lastUpdate}
              </span>
            </div>
            <p className="text-slate-500 text-xs font-mono">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </p>
          </div>
        )}

        {/* Error message */}
        {(state === 'error' || state === 'denied') && error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-3 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action button */}
        {state === 'initial' && (
          <Button
            onClick={requestPermission}
            size="lg"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Permitir Localização
          </Button>
        )}

        {(state === 'error' || state === 'denied') && (
          <Button
            onClick={requestPermission}
            size="lg"
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Tentar Novamente
          </Button>
        )}

        {state === 'active' && (
          <p className="text-slate-500 text-sm">
            Mantenha esta página aberta para continuar rastreando
          </p>
        )}

        {/* Instructions for denied */}
        {state === 'denied' && (
          <div className="mt-4 text-left bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm font-medium mb-2">Como permitir localização:</p>
            <ol className="text-slate-400 text-xs space-y-1 list-decimal list-inside">
              <li>Toque no ícone de cadeado ou configurações do navegador</li>
              <li>Encontre "Localização" ou "Permissões"</li>
              <li>Altere para "Permitir"</li>
              <li>Recarregue esta página</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
