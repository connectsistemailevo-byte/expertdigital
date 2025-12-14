import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProviderTrackingButtonProps {
  providerId: string;
  providerName: string;
}

const ProviderTrackingButton: React.FC<ProviderTrackingButtonProps> = ({ 
  providerId,
  providerName 
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  // Check if popup is still open
  useEffect(() => {
    if (!popupWindow) return;

    const checkPopup = setInterval(() => {
      if (popupWindow.closed) {
        setIsTracking(false);
        setPopupWindow(null);
        toast.info('Rastreamento desativado', {
          description: 'O popup foi fechado. Você está offline agora.',
        });
      }
    }, 1000);

    return () => clearInterval(checkPopup);
  }, [popupWindow]);

  const handleActivateTracking = () => {
    // Create the popup content - simplified without help messages
    const popupContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rastreamento - ${providerName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
            text-align: center;
          }
          .container {
            max-width: 280px;
          }
          .icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            animation: pulse 2s ease-in-out infinite;
          }
          .icon.error {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            animation: none;
          }
          .icon svg {
            width: 30px;
            height: 30px;
            fill: none;
            stroke: white;
            stroke-width: 2;
          }
          h1 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #22c55e;
          }
          h1.error {
            color: #ef4444;
          }
          p {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.5;
          }
          .status {
            margin-top: 16px;
            padding: 8px 16px;
            background: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 20px;
            font-size: 11px;
            color: #22c55e;
          }
          .coords {
            margin-top: 12px;
            font-size: 10px;
            color: #64748b;
            font-family: monospace;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
            50% { transform: scale(1.05); box-shadow: 0 0 20px 5px rgba(34, 197, 94, 0.3); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon" id="iconContainer">
            <svg viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h1 id="title">Localização Ativa</h1>
          <p id="description">Não feche esta janela.</p>
          <div class="status" id="status">Iniciando...</div>
          <div class="coords" id="coords">--</div>
        </div>
        <script>
          const PROVIDER_ID = "${providerId}";
          const SUPABASE_URL = "${import.meta.env.VITE_SUPABASE_URL}";
          const SUPABASE_KEY = "${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}";
          
          let watchId = null;
          let updateInterval = null;
          let lastPosition = null;
          
          function updateStatus(text, isError = false) {
            const el = document.getElementById('status');
            el.textContent = text;
            el.style.background = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
            el.style.borderColor = isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)';
            el.style.color = isError ? '#ef4444' : '#22c55e';
          }
          
          function updateCoords(lat, lng) {
            document.getElementById('coords').textContent = lat.toFixed(6) + ', ' + lng.toFixed(6);
          }

          function setError(isError) {
            const icon = document.getElementById('iconContainer');
            const title = document.getElementById('title');
            if (isError) {
              icon.classList.add('error');
              title.classList.add('error');
            } else {
              icon.classList.remove('error');
              title.classList.remove('error');
            }
          }
          
          async function sendLocation(lat, lng) {
            try {
              const response = await fetch(SUPABASE_URL + '/functions/v1/atualizar-localizacao-prestador', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + SUPABASE_KEY,
                },
                body: JSON.stringify({
                  prestadorId: PROVIDER_ID,
                  latitude: lat,
                  longitude: lng,
                  timestamp: new Date().toISOString()
                })
              });
              
              if (!response.ok) throw new Error('Failed to update');
              
              setError(false);
              document.getElementById('title').textContent = 'Online';
              updateStatus('Atualizado');
              updateCoords(lat, lng);
            } catch (err) {
              console.error('Error sending location:', err);
              updateStatus('Erro ao enviar', true);
            }
          }
          
          async function goOffline() {
            try {
              await fetch(SUPABASE_URL + '/functions/v1/atualizar-localizacao-prestador', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + SUPABASE_KEY,
                },
                body: JSON.stringify({
                  prestadorId: PROVIDER_ID,
                  offline: true
                })
              });
            } catch (err) {
              console.error('Error going offline:', err);
            }
          }
          
          function startTracking() {
            if (!navigator.geolocation) {
              setError(true);
              document.getElementById('title').textContent = 'GPS não suportado';
              updateStatus('GPS não disponível', true);
              return;
            }
            
            updateStatus('Obtendo GPS...');
            
            if (watchId) navigator.geolocation.clearWatch(watchId);
            if (updateInterval) clearInterval(updateInterval);
            
            watchId = navigator.geolocation.watchPosition(
              (position) => {
                lastPosition = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                sendLocation(lastPosition.lat, lastPosition.lng);
              },
              (error) => {
                console.error('Geolocation error:', error);
                setError(true);
                document.getElementById('title').textContent = 'GPS Bloqueado';
                updateStatus('Permita localização', true);
              },
              {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 15000
              }
            );
            
            updateInterval = setInterval(() => {
              if (lastPosition) {
                sendLocation(lastPosition.lat, lastPosition.lng);
              }
            }, 5000);
          }
          
          window.addEventListener('beforeunload', () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            if (updateInterval) clearInterval(updateInterval);
            goOffline();
          });
          
          window.addEventListener('unload', goOffline);
          
          document.addEventListener('visibilitychange', () => {
            if (document.hidden && lastPosition) {
              sendLocation(lastPosition.lat, lastPosition.lng);
            }
          });
          
          startTracking();
        </script>
      </body>
      </html>
    `;

    // Open popup
    const popup = window.open(
      'about:blank',
      'providerTracking',
      'width=260,height=260,resizable=no,scrollbars=no,status=no,menubar=no,toolbar=no'
    );

    if (popup) {
      popup.document.write(popupContent);
      popup.document.close();
      setPopupWindow(popup);
      setIsTracking(true);
      toast.success('Rastreamento ativado!', {
        description: 'Sua localização está sendo compartilhada.',
      });
    } else {
      toast.error('Popup bloqueado', {
        description: 'Por favor, permita popups para ativar o rastreamento.',
      });
    }
  };

  return (
    <Button
      onClick={handleActivateTracking}
      disabled={isTracking}
      className={`w-full ${
        isTracking 
          ? 'bg-green-600 hover:bg-green-600 cursor-default' 
          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
      }`}
      size="lg"
    >
      {isTracking ? (
        <>
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Rastreamento Ativo
        </>
      ) : (
        <>
          <Navigation className="w-5 h-5 mr-2" />
          Ativar Rastreamento do Prestador
        </>
      )}
    </Button>
  );
};

export default ProviderTrackingButton;
