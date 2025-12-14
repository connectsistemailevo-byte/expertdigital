import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, CheckCircle2, Loader2, XCircle } from 'lucide-react';
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
  const [trackingWindow, setTrackingWindow] = useState<Window | null>(null);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');

  // Check if tracking window is still open
  useEffect(() => {
    if (!trackingWindow) return;

    const checkWindow = setInterval(() => {
      if (trackingWindow.closed) {
        setIsTracking(false);
        setTrackingWindow(null);
        setStatus('idle');
        toast.info('Rastreamento desativado', {
          description: 'A janela de rastreamento foi fechada.',
        });
      }
    }, 1000);

    return () => clearInterval(checkWindow);
  }, [trackingWindow]);

  const getPopupHTML = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rastreamento - ${providerName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: white;
    }
    .container {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      max-width: 350px;
      width: 100%;
      border: 1px solid rgba(255,255,255,0.2);
    }
    h1 { font-size: 20px; margin-bottom: 10px; }
    .provider-name { color: #4ade80; font-size: 18px; margin-bottom: 20px; }
    .status-icon { font-size: 60px; margin: 20px 0; }
    .status-text { font-size: 16px; margin-bottom: 20px; }
    .btn {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-error { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .coords { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 15px; word-break: break-all; }
    .pulse { animation: pulse 2s infinite; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .spinner {
      width: 50px; height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: #22c55e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success { color: #4ade80; }
    .error { color: #ef4444; }
    .instructions {
      font-size: 12px;
      color: rgba(255,255,255,0.7);
      margin-top: 15px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚗 Rastreamento GPS</h1>
    <p class="provider-name">${providerName}</p>
    
    <div id="status-container">
      <div class="spinner"></div>
      <p class="status-text pulse">Verificando GPS...</p>
    </div>
    
    <div id="btn-container"></div>
    <div id="coords" class="coords"></div>
  </div>

  <script>
    const PROVIDER_ID = '${providerId}';
    const SUPABASE_URL = '${supabaseUrl}';
    const SUPABASE_KEY = '${supabaseKey}';
    
    let watchId = null;
    let intervalId = null;
    let currentPosition = null;
    let updateCount = 0;

    const statusContainer = document.getElementById('status-container');
    const btnContainer = document.getElementById('btn-container');
    const coordsEl = document.getElementById('coords');

    function updateStatus(icon, text, className = '') {
      statusContainer.innerHTML = '<div class="status-icon">' + icon + '</div><p class="status-text ' + className + '">' + text + '</p>';
    }

    async function sendLocation(lat, lng) {
      try {
        const response = await fetch(SUPABASE_URL + '/functions/v1/atualizar-localizacao-prestador', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY
          },
          body: JSON.stringify({
            prestadorId: PROVIDER_ID,
            latitude: lat,
            longitude: lng
          })
        });
        
        const result = await response.json();
        if (result.success) {
          updateCount++;
          coordsEl.textContent = 'Lat: ' + lat.toFixed(6) + ' | Lng: ' + lng.toFixed(6) + ' | Updates: ' + updateCount;
          return true;
        }
        return false;
      } catch (e) {
        console.error('Error sending location:', e);
        return false;
      }
    }

    async function sendOffline() {
      try {
        await fetch(SUPABASE_URL + '/functions/v1/atualizar-localizacao-prestador', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY
          },
          body: JSON.stringify({
            prestadorId: PROVIDER_ID,
            offline: true
          })
        });
      } catch (e) {
        console.error('Error sending offline:', e);
      }
    }

    function startTracking() {
      if (!navigator.geolocation) {
        updateStatus('❌', 'GPS não suportado neste navegador', 'error');
        return;
      }

      updateStatus('📡', 'Solicitando permissão...', 'pulse');
      
      navigator.geolocation.getCurrentPosition(
        function(position) {
          currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Send initial location
          sendLocation(currentPosition.lat, currentPosition.lng).then(function(success) {
            if (success) {
              updateStatus('✅', 'RASTREAMENTO ATIVO', 'success');
              
              // Start watching position
              watchId = navigator.geolocation.watchPosition(
                function(pos) {
                  currentPosition = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                  };
                },
                function(err) {
                  console.error('Watch error:', err);
                },
                { enableHighAccuracy: true, maximumAge: 5000 }
              );
              
              // Send updates every 5 seconds
              intervalId = setInterval(function() {
                if (currentPosition) {
                  sendLocation(currentPosition.lat, currentPosition.lng);
                }
              }, 5000);
              
              btnContainer.innerHTML = '<button class="btn btn-error" onclick="stopTracking()">Desativar Rastreamento</button>';
            } else {
              updateStatus('⚠️', 'Erro ao enviar localização', 'error');
              btnContainer.innerHTML = '<button class="btn" onclick="startTracking()">Tentar Novamente</button>';
            }
          });
        },
        function(error) {
          console.error('GPS Error:', error);
          let message = 'Erro ao obter localização';
          if (error.code === 1) {
            message = 'Permissão de GPS negada';
          } else if (error.code === 2) {
            message = 'GPS indisponível';
          } else if (error.code === 3) {
            message = 'Tempo esgotado';
          }
          updateStatus('🚫', message, 'error');
          btnContainer.innerHTML = '<button class="btn" onclick="startTracking()">Permitir Localização</button><p class="instructions">Clique no botão acima e permita o acesso à localização quando solicitado pelo navegador.</p>';
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }

    function stopTracking() {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      sendOffline();
      updateStatus('⏸️', 'Rastreamento desativado', '');
      btnContainer.innerHTML = '<button class="btn" onclick="startTracking()">Ativar Novamente</button>';
      coordsEl.textContent = '';
    }

    // Handle page close
    window.addEventListener('beforeunload', function() {
      if (watchId) {
        sendOffline();
      }
    });

    window.addEventListener('visibilitychange', function() {
      if (document.hidden && watchId) {
        // Page is hidden, keep tracking but ensure we update when visible
      }
    });

    // Auto-start tracking
    setTimeout(startTracking, 500);
  </script>
</body>
</html>
    `;
  };

  const handleActivateTracking = () => {
    setStatus('requesting');
    
    // Create popup window with tracking HTML
    const popup = window.open('', 'providerTracking', 'width=400,height=500,resizable=yes,scrollbars=yes');
    
    if (popup) {
      popup.document.write(getPopupHTML());
      popup.document.close();
      setTrackingWindow(popup);
      setIsTracking(true);
      setStatus('active');
      toast.success('Rastreamento iniciado!', {
        description: 'Permita a localização na janela que abriu.',
      });
    } else {
      setStatus('error');
      toast.error('Popup bloqueado', {
        description: 'Permita popups para este site e tente novamente.',
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
      {status === 'requesting' ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Abrindo...
        </>
      ) : isTracking ? (
        <>
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Rastreamento Ativo
        </>
      ) : status === 'error' ? (
        <>
          <XCircle className="w-5 h-5 mr-2" />
          Tentar Novamente
        </>
      ) : (
        <>
          <Navigation className="w-5 h-5 mr-2" />
          Ativar Rastreamento
        </>
      )}
    </Button>
  );
};

export default ProviderTrackingButton;
