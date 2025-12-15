// Background Location Service Worker for Provider Tracking
// This service worker handles background geolocation updates

const SUPABASE_URL = 'https://rydwxrfbsoosmcpqaqid.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZHd4cmZic29vc21jcHFhcWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjYyMTgsImV4cCI6MjA4MDkwMjIxOH0.QwDZcWYikp16y-nhLiHZbISNQsjWTEmVvkQd7r0CzME';

let trackingInterval = null;
let providerId = null;
let isTracking = false;

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  console.log('[BG-SW] Received message:', type, data);
  
  switch (type) {
    case 'START_TRACKING':
      providerId = data.providerId;
      startBackgroundTracking();
      break;
    case 'STOP_TRACKING':
      stopBackgroundTracking();
      break;
    case 'UPDATE_LOCATION':
      if (data.latitude && data.longitude && providerId) {
        sendLocationToServer(data.latitude, data.longitude);
      }
      break;
    case 'PING':
      // Respond to keep-alive pings
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'PONG', timestamp: Date.now() });
        });
      });
      break;
  }
});

function startBackgroundTracking() {
  if (isTracking) return;
  
  isTracking = true;
  console.log('[BG-SW] Starting background tracking for provider:', providerId);
  
  // Send status to main thread
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'TRACKING_STARTED', providerId });
    });
  });
}

function stopBackgroundTracking() {
  isTracking = false;
  console.log('[BG-SW] Stopping background tracking');
  
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  
  // Send offline status
  if (providerId) {
    sendOfflineStatus();
  }
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'TRACKING_STOPPED' });
    });
  });
}

async function sendLocationToServer(latitude, longitude) {
  if (!providerId) {
    console.log('[BG-SW] No provider ID, skipping location update');
    return;
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/atualizar-localizacao-prestador`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        prestadorId: providerId,
        latitude,
        longitude
      })
    });
    
    if (response.ok) {
      console.log('[BG-SW] Location sent successfully:', latitude, longitude);
      
      // Notify main thread
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ 
            type: 'LOCATION_UPDATED', 
            latitude, 
            longitude,
            timestamp: Date.now()
          });
        });
      });
    } else {
      console.error('[BG-SW] Failed to send location:', response.status);
    }
  } catch (error) {
    console.error('[BG-SW] Error sending location:', error);
  }
}

async function sendOfflineStatus() {
  if (!providerId) return;
  
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/atualizar-localizacao-prestador`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        prestadorId: providerId,
        offline: true
      })
    });
    console.log('[BG-SW] Offline status sent');
  } catch (error) {
    console.error('[BG-SW] Error sending offline status:', error);
  }
}

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[BG-SW] Service worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle service worker install
self.addEventListener('install', (event) => {
  console.log('[BG-SW] Service worker installed');
  self.skipWaiting();
});

// Handle periodic sync for background updates (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'location-sync' && isTracking && providerId) {
    console.log('[BG-SW] Periodic sync triggered');
    event.waitUntil(requestLocationFromClient());
  }
});

async function requestLocationFromClient() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'REQUEST_LOCATION' });
  });
}

// Keep service worker alive with self-ping
setInterval(() => {
  if (isTracking) {
    console.log('[BG-SW] Keep-alive ping, tracking:', isTracking);
  }
}, 20000);
