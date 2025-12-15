import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, CheckCircle2, Loader2, XCircle, Navigation, AlertTriangle } from 'lucide-react';

interface ProviderLocationPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
  onSuccess?: () => void;
}

type PermissionStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

export const ProviderLocationPermissionModal: React.FC<ProviderLocationPermissionModalProps> = ({
  open,
  onOpenChange,
  providerId,
  providerName,
  onSuccess
}) => {
  const [status, setStatus] = useState<PermissionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Enviar localização para o backend
  const sendLocationToBackend = useCallback(async (lat: number, lng: number) => {
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
        setStatus('granted');
        onSuccess?.();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error sending location:', e);
      return false;
    }
  }, [providerId, onSuccess]);

  // Solicitar permissão de localização
  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocalização não suportada neste dispositivo.');
      return;
    }

    setStatus('requesting');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        const success = await sendLocationToBackend(lat, lng);
        
        if (success) {
          setStatus('granted');
        } else {
          setStatus('error');
          setError('Erro ao enviar localização. Tente novamente.');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        if (error.code === 1) {
          setStatus('denied');
          setError('Você precisa permitir o acesso à localização para ficar online.');
        } else if (error.code === 2) {
          setStatus('error');
          setError('GPS indisponível. Verifique se o GPS está ativado.');
        } else if (error.code === 3) {
          setStatus('error');
          setError('Tempo esgotado ao obter localização. Tente novamente.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  }, [sendLocationToBackend]);

  // Auto-solicitar quando modal abrir
  useEffect(() => {
    if (open && status === 'idle') {
      requestLocationPermission();
    }
  }, [open, status, requestLocationPermission]);

  // Reset quando fechar
  useEffect(() => {
    if (!open) {
      // Não resetar se foi granted para manter o estado de sucesso
      if (status !== 'granted') {
        setStatus('idle');
        setError(null);
      }
    }
  }, [open, status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="w-6 h-6 text-green-400" />
            Ativar Localização
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Olá, <span className="font-semibold text-green-400">{providerName}</span>! 
            Permita o acesso à sua localização para ficar online no mapa.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Requesting */}
          {status === 'requesting' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              </div>
              <p className="text-lg font-medium text-white mb-2">Solicitando permissão...</p>
              <p className="text-sm text-slate-400">
                Clique em <span className="font-semibold text-green-400">"Permitir"</span> quando o navegador solicitar.
              </p>
            </div>
          )}

          {/* Granted */}
          {status === 'granted' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <p className="text-lg font-bold text-green-400 mb-2">Você está ONLINE!</p>
              <p className="text-sm text-slate-400 mb-4">
                Sua localização está sendo compartilhada com os clientes.
              </p>
              {coords && (
                <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400">
                  <p>Lat: {coords.lat.toFixed(6)} | Lng: {coords.lng.toFixed(6)}</p>
                </div>
              )}
            </div>
          )}

          {/* Denied */}
          {status === 'denied' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <p className="text-lg font-bold text-red-400 mb-2">Permissão Negada</p>
              <p className="text-sm text-slate-400 mb-4">{error}</p>
              
              <div className="bg-slate-800/50 rounded-lg p-4 text-left mb-4">
                <p className="text-xs font-medium text-white mb-2">Como permitir:</p>
                <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Abra as configurações do navegador</li>
                  <li>Vá em "Configurações do site" ou "Permissões"</li>
                  <li>Permita acesso à localização</li>
                  <li>Recarregue a página e tente novamente</li>
                </ol>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-yellow-400" />
              </div>
              <p className="text-lg font-bold text-yellow-400 mb-2">Erro</p>
              <p className="text-sm text-slate-400 mb-4">{error}</p>
            </div>
          )}

          {/* Idle - não deveria aparecer, mas por segurança */}
          {status === 'idle' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
                <Navigation className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-white mb-2">Ativar Localização</p>
              <p className="text-sm text-slate-400">
                Clique no botão abaixo para ativar sua localização.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {status === 'granted' ? (
            <Button 
              onClick={() => onOpenChange(false)} 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Continuar Online
            </Button>
          ) : status === 'denied' || status === 'error' ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Fechar
              </Button>
              <Button 
                onClick={requestLocationPermission}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </>
          ) : status === 'idle' ? (
            <Button 
              onClick={requestLocationPermission}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Permitir Localização
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderLocationPermissionModal;
