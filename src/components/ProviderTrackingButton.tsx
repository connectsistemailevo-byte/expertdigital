import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProviderTrackingButtonProps {
  providerId: string;
  providerName: string;
}

const ProviderTrackingButton: React.FC<ProviderTrackingButtonProps> = ({ 
  providerId,
  providerName 
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'error'>('idle');
  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const currentPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  // Função para enviar localização ao backend
  const sendLocation = useCallback(async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('atualizar-localizacao-prestador', {
        body: {
          prestadorId: providerId,
          latitude: lat,
          longitude: lng
        }
      });

      if (error) {
        console.error('Erro ao enviar localização:', error);
        return false;
      }
      
      console.log('Localização enviada:', { lat, lng, data });
      return data?.success || false;
    } catch (e) {
      console.error('Erro ao enviar localização:', e);
      return false;
    }
  }, [providerId]);

  // Função para enviar status offline
  const sendOffline = useCallback(async () => {
    try {
      await supabase.functions.invoke('atualizar-localizacao-prestador', {
        body: {
          prestadorId: providerId,
          offline: true
        }
      });
      console.log('Status offline enviado');
    } catch (e) {
      console.error('Erro ao enviar offline:', e);
    }
  }, [providerId]);

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
    setIsTracking(false);
    setStatus('idle');
    currentPositionRef.current = null;
    toast.info('Rastreamento desativado');
  }, [sendOffline]);

  // Iniciar rastreamento
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      toast.error('GPS não suportado', {
        description: 'Seu navegador não suporta geolocalização.'
      });
      return;
    }

    setStatus('requesting');

    // Solicitar permissão e posição atual
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        currentPositionRef.current = { lat, lng };

        // Enviar localização inicial
        sendLocation(lat, lng).then((success) => {
          if (success) {
            setIsTracking(true);
            setStatus('active');
            toast.success('Rastreamento ativado!', {
              description: 'Sua localização está sendo compartilhada.'
            });

            // Monitorar posição continuamente
            watchIdRef.current = navigator.geolocation.watchPosition(
              (pos) => {
                currentPositionRef.current = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude
                };
              },
              (err) => {
                console.error('Erro no watch:', err);
              },
              { 
                enableHighAccuracy: true, 
                maximumAge: 5000,
                timeout: 30000
              }
            );

            // Enviar atualizações a cada 5 segundos
            intervalIdRef.current = setInterval(() => {
              if (currentPositionRef.current) {
                sendLocation(currentPositionRef.current.lat, currentPositionRef.current.lng);
              }
            }, 5000);
          } else {
            setStatus('error');
            toast.error('Erro ao ativar rastreamento', {
              description: 'Não foi possível enviar sua localização.'
            });
          }
        });
      },
      (error) => {
        console.error('Erro GPS:', error);
        
        if (error.code === 1) {
          setStatus('denied');
          toast.error('Permissão negada', {
            description: 'Você precisa permitir o acesso à localização. Vá nas configurações do navegador e permita a localização para este site.',
            duration: 8000
          });
        } else if (error.code === 2) {
          setStatus('error');
          toast.error('GPS indisponível', {
            description: 'Verifique se o GPS está ativado no seu dispositivo.'
          });
        } else {
          setStatus('error');
          toast.error('Erro de localização', {
            description: 'Tempo esgotado. Tente novamente.'
          });
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 20000, 
        maximumAge: 0 
      }
    );
  }, [sendLocation]);

  // Cleanup quando componente desmonta ou página fecha
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTracking) {
        // Tentar enviar offline de forma síncrona
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/atualizar-localizacao-prestador`, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`);
        try {
          xhr.send(JSON.stringify({ prestadorId: providerId, offline: true }));
        } catch (e) {
          console.error('Erro ao enviar offline:', e);
        }
      }
    };

    const handleVisibilityChange = () => {
      // Quando a página volta a ficar visível, reenviar localização
      if (!document.hidden && isTracking && currentPositionRef.current) {
        sendLocation(currentPositionRef.current.lat, currentPositionRef.current.lng);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Cleanup do rastreamento
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [isTracking, providerId, sendLocation]);

  return (
    <div className="space-y-2">
      <Button
        onClick={isTracking ? stopTracking : startTracking}
        className={`w-full ${
          isTracking 
            ? 'bg-red-600 hover:bg-red-700' 
            : status === 'denied'
            ? 'bg-yellow-600 hover:bg-yellow-700'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
        }`}
        size="lg"
        disabled={status === 'requesting'}
      >
        {status === 'requesting' ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Solicitando permissão...
          </>
        ) : isTracking ? (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Desativar Rastreamento
          </>
        ) : status === 'denied' ? (
          <>
            <XCircle className="w-5 h-5 mr-2" />
            Permissão Negada - Tentar Novamente
          </>
        ) : status === 'error' ? (
          <>
            <XCircle className="w-5 h-5 mr-2" />
            Erro - Tentar Novamente
          </>
        ) : (
          <>
            <Navigation className="w-5 h-5 mr-2" />
            Ativar Rastreamento GPS
          </>
        )}
      </Button>
      
      {status === 'denied' && (
        <div className="text-xs text-yellow-400 bg-yellow-900/30 p-2 rounded-lg">
          <p className="font-medium mb-1">⚠️ Permissão de localização negada</p>
          <p>Para ativar o rastreamento:</p>
          <ol className="list-decimal list-inside mt-1 space-y-0.5">
            <li>Abra as configurações do navegador</li>
            <li>Vá em Permissões ou Configurações do site</li>
            <li>Permita a localização para este site</li>
            <li>Recarregue a página e tente novamente</li>
          </ol>
        </div>
      )}
      
      {isTracking && (
        <p className="text-xs text-green-400 text-center">
          ✓ Rastreamento ativo - você está online para os clientes
        </p>
      )}
    </div>
  );
};

export default ProviderTrackingButton;
