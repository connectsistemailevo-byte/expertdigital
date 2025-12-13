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
    // Create the popup content
    const popupContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rastreamento Ativo - ${providerName}</title>
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
          .help-box {
            margin-top: 16px;
            padding: 12px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            text-align: left;
          }
          .help-box h3 {
            font-size: 12px;
            color: #ef4444;
            margin-bottom: 8px;
          }
          .help-box ol {
            font-size: 11px;
            color: #94a3b8;
            padding-left: 16px;
          }
          .help-box li {
            margin-bottom: 4px;
          }
          .retry-btn {
            margin-top: 12px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
          }
          .retry-btn:hover {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
            50% { transform: scale(1.05); box-shadow: 0 0 20px 5px rgba(34, 197, 94, 0.3); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">
            <svg viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h1 id="title">Localização Ativa</h1>
          <p id="description">Não feche esta janela.<br/>Sua localização está sendo compartilhada com clientes.</p>
          <div class="status" id="status">Iniciando...</div>
          <div class="coords" id="coords">--</div>
          <div class="help-box" id="helpBox" style="display: none;">
            <h3>Como permitir localização:</h3>
            <ol>
              <li>Abra as <b>Configurações</b> do celular</li>
              <li>Vá em <b>Localização</b> ou <b>Privacidade</b></li>
              <li>Ative a <b>Localização/GPS</b></li>
              <li>Volte ao navegador e permita quando solicitado</li>
            </ol>
            <button class="retry-btn" onclick="retryGPS()">Tentar Novamente</button>
          </div>
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
              
              updateStatus('Online • Atualizado');
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
          
          function showError(errorCode) {
            const icon = document.querySelector('.icon');
            const title = document.getElementById('title');
            const desc = document.getElementById('description');
            const helpBox = document.getElementById('helpBox');
            
            icon.classList.add('error');
            title.classList.add('error');
            
            if (errorCode === 1) {
              title.textContent = 'GPS Bloqueado';
              desc.textContent = 'Você precisa permitir o acesso à localização para compartilhar sua posição com clientes.';
              helpBox.style.display = 'block';
            } else if (errorCode === 2) {
              title.textContent = 'GPS Indisponível';
              desc.textContent = 'O GPS do seu dispositivo não está funcionando. Verifique se está ativado.';
              helpBox.style.display = 'block';
            } else {
              title.textContent = 'Tempo Esgotado';
              desc.textContent = 'Não foi possível obter sua localização. Verifique o sinal GPS.';
              helpBox.style.display = 'block';
            }
          }
          
          function retryGPS() {
            const icon = document.querySelector('.icon');
            const title = document.getElementById('title');
            const desc = document.getElementById('description');
            const helpBox = document.getElementById('helpBox');
            
            icon.classList.remove('error');
            title.classList.remove('error');
            title.textContent = 'Localização Ativa';
            desc.textContent = 'Não feche esta janela.<br/>Sua localização está sendo compartilhada com clientes.';
            helpBox.style.display = 'none';
            
            startTracking();
          }
          
          function startTracking() {
            if (!navigator.geolocation) {
              updateStatus('GPS não suportado', true);
              showError(2);
              return;
            }
            
            updateStatus('Obtendo localização...');
            
            // Clear previous watchers
            if (watchId) navigator.geolocation.clearWatch(watchId);
            if (updateInterval) clearInterval(updateInterval);
            
            // Watch position continuously
            watchId = navigator.geolocation.watchPosition(
              (position) => {
                // Hide error state if was showing
                const icon = document.querySelector('.icon');
                const title = document.getElementById('title');
                const helpBox = document.getElementById('helpBox');
                icon.classList.remove('error');
                title.classList.remove('error');
                title.textContent = 'Localização Ativa';
                helpBox.style.display = 'none';
                
                lastPosition = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                sendLocation(lastPosition.lat, lastPosition.lng);
              },
              (error) => {
                console.error('Geolocation error:', error);
                let errorMsg = 'Erro de GPS';
                switch(error.code) {
                  case 1: errorMsg = 'GPS bloqueado - permita localização'; break;
                  case 2: errorMsg = 'GPS indisponível - verifique sinal'; break;
                  case 3: errorMsg = 'Tempo esgotado - tente novamente'; break;
                }
                updateStatus(errorMsg, true);
                showError(error.code);
              },
              {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 15000
              }
            );
            
            // Also send updates every 5 seconds even if position hasn't changed
            updateInterval = setInterval(() => {
              if (lastPosition) {
                sendLocation(lastPosition.lat, lastPosition.lng);
              }
            }, 5000);
          }
          
          // Handle page close/unload
          window.addEventListener('beforeunload', () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            if (updateInterval) clearInterval(updateInterval);
            goOffline();
          });
          
          window.addEventListener('unload', goOffline);
          
          // Handle visibility change (for mobile background)
          document.addEventListener('visibilitychange', () => {
            if (document.hidden && lastPosition) {
              // Keep updating in background
              sendLocation(lastPosition.lat, lastPosition.lng);
            }
          });
          
          // Start tracking
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
