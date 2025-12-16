import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrackingState {
  isTracking: boolean;
  isPWA: boolean;
  coords: { lat: number; lng: number } | null;
  lastUpdate: Date | null;
  updateCount: number;
  error: string | null;
  status: 'idle' | 'requesting' | 'active' | 'denied' | 'error' | 'unavailable';
}

interface UseBackgroundTrackingProps {
  providerId: string | null;
}

export function useBackgroundTracking({ providerId }: UseBackgroundTrackingProps) {
  const [state, setState] = useState<TrackingState>({
    isTracking: false,
    isPWA: false,
    coords: null,
    lastUpdate: null,
    updateCount: 0,
    error: null,
    status: 'idle'
  });

  const serviceWorkerRef = useRef<ServiceWorker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const currentPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  // Check if running as PWA
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSPWA = (window.navigator as any).standalone === true;
      const isPWA = isStandalone || isIOSPWA;
      
      setState(prev => ({ ...prev, isPWA }));
      console.log('[Tracking] PWA mode:', isPWA);
    };

    checkPWA();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWA);
    
    return () => mediaQuery.removeEventListener('change', checkPWA);
  }, []);

  // Register background service worker
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/background-location-sw.js', {
            scope: '/'
          });
          
          console.log('[Tracking] Background SW registered:', registration.scope);
          
          // Get the active worker
          serviceWorkerRef.current = registration.active || registration.waiting || registration.installing;
          
          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
          
        } catch (error) {
          console.error('[Tracking] SW registration failed:', error);
        }
      }
    };

    registerServiceWorker();
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const handleServiceWorkerMessage = useCallback((event: MessageEvent) => {
    const { type, latitude, longitude, timestamp } = event.data;
    
    console.log('[Tracking] SW message:', type);
    
    switch (type) {
      case 'LOCATION_UPDATED':
        setState(prev => ({
          ...prev,
          coords: { lat: latitude, lng: longitude },
          lastUpdate: new Date(timestamp),
          updateCount: prev.updateCount + 1
        }));
        break;
      case 'TRACKING_STARTED':
        setState(prev => ({ ...prev, isTracking: true, status: 'active' }));
        break;
      case 'TRACKING_STOPPED':
        setState(prev => ({ ...prev, isTracking: false, status: 'idle' }));
        break;
      case 'REQUEST_LOCATION':
        // Service worker is requesting current location
        if (currentPositionRef.current) {
          sendLocationToSW(currentPositionRef.current.lat, currentPositionRef.current.lng);
        }
        break;
    }
  }, []);

  const sendLocationToSW = useCallback((lat: number, lng: number) => {
    if (serviceWorkerRef.current) {
      serviceWorkerRef.current.postMessage({
        type: 'UPDATE_LOCATION',
        data: { latitude: lat, longitude: lng }
      });
    }
  }, []);

  // Request wake lock to prevent screen from sleeping
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('[Tracking] Wake lock acquired');
        
        wakeLockRef.current?.addEventListener('release', () => {
          console.log('[Tracking] Wake lock released');
        });
      } catch (error) {
        console.log('[Tracking] Wake lock not available:', error);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  // Send location to backend
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
        setState(prev => ({
          ...prev,
          coords: { lat, lng },
          lastUpdate: new Date(),
          updateCount: prev.updateCount + 1
        }));
        
        // Also notify service worker
        sendLocationToSW(lat, lng);
        
        return true;
      }
      return false;
    } catch (e) {
      console.error('[Tracking] Error sending location:', e);
      return false;
    }
  }, [providerId, sendLocationToSW]);

  // Send offline status
  const sendOffline = useCallback(async () => {
    if (!providerId) return;
    
    try {
      await supabase.functions.invoke('atualizar-localizacao-prestador', {
        body: {
          prestadorId: providerId,
          offline: true
        }
      });
      console.log('[Tracking] Sent offline status');
    } catch (e) {
      console.error('[Tracking] Error sending offline:', e);
    }
  }, [providerId]);

  const AUTO_TRACKING_KEY = 'showtime_provider_auto_tracking';

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!providerId) return;

    // Guard against duplicate starts
    if (state.status === 'requesting' || state.status === 'active' || state.isTracking) return;

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        status: 'unavailable',
        error: 'GPS não suportado neste navegador'
      }));
      return;
    }

    setState(prev => ({ ...prev, status: 'requesting', error: null }));

    // Request wake lock
    await requestWakeLock();

    // Notify service worker
    if (serviceWorkerRef.current) {
      serviceWorkerRef.current.postMessage({
        type: 'START_TRACKING',
        data: { providerId }
      });
    }

    // Request current position first
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        currentPositionRef.current = { lat, lng };

        const success = await sendLocation(lat, lng);

        if (success) {
          // Persist "auto start" so provider doesn't need to manually activate every time
          localStorage.setItem(AUTO_TRACKING_KEY, 'true');

          setState(prev => ({ ...prev, status: 'active', isTracking: true }));

          // Start watching position with high accuracy
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              currentPositionRef.current = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              };
            },
            (err) => {
              console.error('[Tracking] Watch error:', err);
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
          setState(prev => ({
            ...prev,
            status: 'error',
            error: 'Erro ao enviar localização inicial'
          }));
        }
      },
      (error) => {
        console.error('[Tracking] GPS Error:', error);

        let errorMsg = 'Não foi possível obter sua localização.';
        let status: TrackingState['status'] = 'error';

        if (error.code === 1) {
          status = 'denied';
          errorMsg = 'Você precisa permitir o acesso à localização para usar o rastreamento.';
          // If denied, don't keep auto enabled
          localStorage.removeItem(AUTO_TRACKING_KEY);
        } else if (error.code === 2) {
          errorMsg = 'GPS indisponível. Verifique se o GPS está ativado no seu dispositivo.';
        } else if (error.code === 3) {
          errorMsg = 'Tempo esgotado ao obter localização. Tente novamente.';
        }

        setState(prev => ({ ...prev, status, error: errorMsg }));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  }, [providerId, requestWakeLock, sendLocation, state.isTracking, state.status]);

  // Stop tracking (manual action by provider)
  const stopTracking = useCallback(() => {
    // Clear watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Clear interval
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Release wake lock
    releaseWakeLock();

    // Notify service worker
    if (serviceWorkerRef.current) {
      serviceWorkerRef.current.postMessage({ type: 'STOP_TRACKING' });
    }

    // Send offline status (only on manual stop)
    sendOffline();

    // Provider explicitly stopped -> disable auto tracking
    localStorage.removeItem(AUTO_TRACKING_KEY);

    setState(prev => ({
      ...prev,
      isTracking: false,
      status: 'idle',
      coords: null,
      updateCount: 0
    }));
  }, [releaseWakeLock, sendOffline]);

  // Handle visibility change - try to continue tracking in background
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && state.isTracking) {
        console.log('[Tracking] App went to background, continuing tracking...');
        
        // Try to reacquire wake lock when coming back
      } else if (!document.hidden && state.isTracking) {
        console.log('[Tracking] App came to foreground');
        
        // Reacquire wake lock
        await requestWakeLock();
        
        // Send current location immediately
        if (currentPositionRef.current) {
          sendLocation(currentPositionRef.current.lat, currentPositionRef.current.lng);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isTracking, requestWakeLock, sendLocation]);

  // Cleanup on unmount - DON'T send offline, just cleanup resources
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return {
    ...state,
    startTracking,
    stopTracking
  };
}
