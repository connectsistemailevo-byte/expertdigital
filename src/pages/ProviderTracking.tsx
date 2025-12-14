import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Navigation, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TrackingStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error' | 'unavailable';

const ProviderTracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get('id');
  const providerName = searchParams.get('name') || 'Prestador';

  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const currentPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const sendLocation = useCallback(async (lat: number, lng: number) => {
    if (!providerId) return false;
    
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
        setUpdateCount(prev => prev + 1);
        setCoords({ lat, lng });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error sending location:', e);
      return false;
    }
  }, [providerId]);

  const sendOffline = useCallback(async () => {
    if (!providerId) return;
    
    try {
      await supabase.functions.invoke('atualizar-localizacao-prestador', {
        body: {
          prestadorId: providerId,
          offline: true
        }
      });
    } catch (e) {
      console.error('Error sending offline:', e);
    }
  }, [providerId]);

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
  }, [sendOffline]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      setErrorMessage('GPS não suportado neste navegador');
      return;
    }

    setStatus('requesting');
    setErrorMessage('');

    // Request current position first to trigger permission prompt
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        currentPositionRef.current = { lat, lng };

        // Send initial location
        sendLocation(lat, lng).then((success) => {
          if (success) {
            setStatus('active');

            // Start watching position with high accuracy
            watchIdRef.current = navigator.geolocation.watchPosition(
              (pos) => {
                currentPositionRef.current = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude
                };
              },
              (err) => {
                console.error('Watch error:', err);
              },
              { 
                enableHighAccuracy: true, 
                maximumAge: 5000,
                timeout: 30000
              }
            );

            // Send updates every 5 seconds
            intervalIdRef.current = setInterval(() => {
              if (currentPositionRef.current) {
                sendLocation(currentPositionRef.current.lat, currentPositionRef.current.lng);
              }
            }, 5000);
          } else {
            setStatus('error');
            setErrorMessage('Erro ao enviar localização inicial');
          }
        });
      },
      (error) => {
        console.error('GPS Error:', error);
        
        if (error.code === 1) {
          setStatus('denied');
          setErrorMessage('Você precisa permitir o acesso à localização para usar o rastreamento.');
        } else if (error.code === 2) {
          setStatus('error');
          setErrorMessage('GPS indisponível. Verifique se o GPS está ativado no seu dispositivo.');
        } else if (error.code === 3) {
          setStatus('error');
          setErrorMessage('Tempo esgotado ao obter localização. Tente novamente.');
        } else {
          setStatus('error');
          setErrorMessage('Erro ao obter localização.');
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 20000, 
        maximumAge: 0 
      }
    );
  }, [sendLocation]);

  // Handle page visibility and unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (watchIdRef.current !== null) {
        sendOffline();
      }
    };

    const handleVisibilityChange = () => {
      // When page becomes visible again, continue tracking
      if (!document.hidden && status === 'active' && currentPositionRef.current) {
        sendLocation(currentPositionRef.current.lat, currentPositionRef.current.lng);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendOffline, sendLocation, status]);

  // Cleanup on unmount
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

  // Auto-start when page loads
  useEffect(() => {
    if (providerId && status === 'idle') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startTracking();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [providerId, status, startTracking]);

  if (!providerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-xl font-bold mb-2">Erro</h1>
          <p className="text-muted-foreground">ID do prestador não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 max-w-sm w-full text-center">
        <div className="text-4xl mb-2">🚗</div>
        <h1 className="text-xl font-bold text-white mb-1">Rastreamento GPS</h1>
        <p className="text-green-400 text-lg mb-6">{decodeURIComponent(providerName)}</p>

        {/* Status Display */}
        <div className="mb-6">
          {status === 'idle' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-white animate-spin" />
              <p className="text-white/80">Iniciando...</p>
            </>
          )}

          {status === 'requesting' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-green-400 animate-spin" />
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
                <p className="text-white/40 text-xs mt-4 font-mono">
                  Lat: {coords.lat.toFixed(6)} | Lng: {coords.lng.toFixed(6)}
                  <br />
                  Atualizações: {updateCount}
                </p>
              )}
            </>
          )}

          {status === 'denied' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <p className="text-red-400 text-lg font-bold mb-2">Permissão Negada</p>
              <p className="text-white/60 text-sm">{errorMessage}</p>
              <div className="mt-4 p-3 bg-white/5 rounded-lg text-left">
                <p className="text-white/80 text-xs font-medium mb-2">Como permitir:</p>
                <ol className="text-white/60 text-xs space-y-1 list-decimal list-inside">
                  <li>Abra as configurações do navegador</li>
                  <li>Vá em "Configurações do site" ou "Permissões"</li>
                  <li>Encontre "Localização" e permita para este site</li>
                  <li>Volte e clique no botão abaixo</li>
                </ol>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <p className="text-yellow-400 text-lg font-bold mb-2">Erro</p>
              <p className="text-white/60 text-sm">{errorMessage}</p>
            </>
          )}

          {status === 'unavailable' && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <p className="text-red-400 text-lg font-bold mb-2">GPS Indisponível</p>
              <p className="text-white/60 text-sm">{errorMessage}</p>
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

        {/* Keep alive notice */}
        {status === 'active' && (
          <p className="text-white/40 text-xs mt-6">
            💡 Mantenha esta aba aberta para rastreamento contínuo
          </p>
        )}
      </div>
    </div>
  );
};

export default ProviderTracking;
