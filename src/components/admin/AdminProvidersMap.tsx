import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface ProviderLocation {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_whatsapp: string;
  latitude: number;
  longitude: number;
  is_online: boolean;
  last_seen_at: string;
}

interface ClientLocation {
  id: string;
  session_id: string;
  latitude: number;
  longitude: number;
  region: string | null;
  city: string | null;
  state_uf: string | null;
  last_seen_at: string;
}

interface AdminProvidersMapProps {
  locations: ProviderLocation[];
  clientLocations?: ClientLocation[];
  className?: string;
  onToggleOnline?: (providerId: string, isOnline: boolean) => void;
  focusProviderId?: string | null;
  showClients?: boolean;
}

const AdminProvidersMap: React.FC<AdminProvidersMapProps> = ({ 
  locations, 
  clientLocations = [],
  className, 
  onToggleOnline,
  focusProviderId,
  showClients = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, { marker: mapboxgl.Marker; popup: mapboxgl.Popup; element: HTMLDivElement }>>(new Map());
  const clientMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const initialFitDone = useRef(false);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (!error && data?.token) {
          setMapboxToken(data.token);
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
      }
    };
    fetchToken();
  }, []);

  // Calculate time ago
  const getTimeAgo = useCallback((dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  }, []);

  // Create popup content
  const createPopupContent = useCallback((loc: ProviderLocation) => {
    const popupContent = document.createElement('div');
    const timeAgo = loc.last_seen_at ? getTimeAgo(loc.last_seen_at) : '--';
    
    popupContent.innerHTML = `
      <div style="
        background: #1e293b;
        padding: 12px;
        border-radius: 8px;
        color: white;
        min-width: 180px;
      ">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
          ${loc.provider_name}
        </div>
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
          ${loc.provider_whatsapp}
        </div>
        <div style="
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          background: ${loc.is_online ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)'};
          color: ${loc.is_online ? '#22c55e' : '#94a3b8'};
          margin-bottom: 8px;
        ">
          ${loc.is_online ? '● Online' : '○ Offline'}
        </div>
        <div style="font-size: 10px; color: #64748b; margin-bottom: 10px;">
          Atualizado: ${timeAgo}
        </div>
        <button 
          class="toggle-btn"
          style="
            width: 100%;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            background: ${loc.is_online ? '#ef4444' : '#22c55e'};
            color: white;
            transition: opacity 0.2s;
          "
        >
          ${loc.is_online ? 'Colocar Offline' : 'Colocar Online'}
        </button>
      </div>
    `;

    const toggleBtn = popupContent.querySelector('.toggle-btn');
    if (toggleBtn && onToggleOnline) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onToggleOnline(loc.provider_id, !loc.is_online);
      });
    }

    return popupContent;
  }, [onToggleOnline, getTimeAgo]);

  // Update marker appearance
  const updateMarkerAppearance = useCallback((element: HTMLDivElement, isOnline: boolean, name: string) => {
    const innerDiv = element.querySelector('div') as HTMLDivElement;
    if (innerDiv) {
      innerDiv.style.background = isOnline 
        ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
        : 'linear-gradient(135deg, #64748b, #475569)';
      innerDiv.style.borderColor = isOnline ? '#22c55e' : '#64748b';
      
      // Update or add/remove pulse indicator
      let pulseDiv = innerDiv.querySelector('.pulse-indicator') as HTMLDivElement;
      if (isOnline && !pulseDiv) {
        pulseDiv = document.createElement('div');
        pulseDiv.className = 'pulse-indicator';
        pulseDiv.style.cssText = `
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: #22c55e;
          border-radius: 50%;
          border: 2px solid #1a1f2e;
          animation: pulse 2s infinite;
        `;
        innerDiv.appendChild(pulseDiv);
      } else if (!isOnline && pulseDiv) {
        pulseDiv.remove();
      }
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    // Default center to Brazil
    const center: [number, number] = [-49.28, -16.71];
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom: 5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      markers.current.forEach(({ marker }) => marker.remove());
      markers.current.clear();
      clientMarkers.current.forEach(marker => marker.remove());
      clientMarkers.current.clear();
      map.current?.remove();
      map.current = null;
      initialFitDone.current = false;
    };
  }, [mapboxToken]);

  // Focus on specific provider when focusProviderId changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !focusProviderId) return;
    
    const provider = locations.find(l => l.provider_id === focusProviderId);
    if (provider) {
      map.current.flyTo({
        center: [provider.longitude, provider.latitude],
        zoom: 15,
        duration: 1000,
      });
      
      // Open popup for this provider
      const markerData = markers.current.get(provider.provider_id);
      if (markerData) {
        markerData.popup.addTo(map.current);
      }
    }
  }, [focusProviderId, locations, mapLoaded]);

  // Update provider markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const currentIds = new Set(locations.map(loc => loc.provider_id));
    
    // Remove markers that are no longer present
    markers.current.forEach(({ marker }, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    // Add or update markers
    locations.forEach(loc => {
      const existing = markers.current.get(loc.provider_id);
      
      if (existing) {
        // Silently update position if changed
        const currentPos = existing.marker.getLngLat();
        if (currentPos.lng !== loc.longitude || currentPos.lat !== loc.latitude) {
          existing.marker.setLngLat([loc.longitude, loc.latitude]);
        }
        
        updateMarkerAppearance(existing.element, loc.is_online, loc.provider_name);
        
        // Update popup content
        const newContent = createPopupContent(loc);
        existing.popup.setDOMContent(newContent);
      } else {
        // Create new marker with enhanced design like reference image
        const el = document.createElement('div');
        el.className = 'admin-provider-marker';
        const timeAgo = loc.last_seen_at ? getTimeAgo(loc.last_seen_at) : '--';
        
        el.innerHTML = `
          <div style="
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
          ">
            <!-- Status badge and name card -->
            <div style="
              background: rgba(10, 15, 26, 0.95);
              border-radius: 8px;
              padding: 8px 10px;
              margin-bottom: 6px;
              border: 1px solid ${loc.is_online ? 'rgba(34, 197, 94, 0.4)' : 'rgba(100, 116, 139, 0.3)'};
              min-width: 80px;
            ">
              <!-- Online status badge -->
              <div style="
                display: flex;
                justify-content: center;
                margin-bottom: 4px;
              ">
                <span style="
                  background: ${loc.is_online ? 'rgba(34, 197, 94, 0.25)' : 'rgba(100, 116, 139, 0.25)'};
                  color: ${loc.is_online ? '#22c55e' : '#94a3b8'};
                  padding: 2px 8px;
                  border-radius: 10px;
                  font-size: 9px;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  border: 1px solid ${loc.is_online ? 'rgba(34, 197, 94, 0.5)' : 'rgba(100, 116, 139, 0.3)'};
                ">● ${loc.is_online ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
              
              <!-- Provider name -->
              <div style="
                color: white;
                font-size: 12px;
                font-weight: 600;
                text-align: center;
                white-space: nowrap;
                margin-bottom: 4px;
              ">${loc.provider_name}</div>
              
              <!-- Time info -->
              <div style="
                display: flex;
                justify-content: center;
                gap: 6px;
                color: #22c55e;
                font-size: 10px;
                font-weight: 500;
              ">
                <span style="display: flex; align-items: center; gap: 2px;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  ${timeAgo}
                </span>
              </div>
            </div>
            
            <!-- Truck icon -->
            <div style="
              width: 36px;
              height: 36px;
              background: ${loc.is_online ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #64748b, #475569)'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid rgba(10, 15, 26, 0.9);
              cursor: pointer;
              position: relative;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 3v5h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              ${loc.is_online ? `
                <div class="pulse-indicator" style="
                  position: absolute;
                  top: -2px;
                  right: -2px;
                  width: 10px;
                  height: 10px;
                  background: #22c55e;
                  border-radius: 50%;
                  border: 2px solid rgba(10, 15, 26, 0.9);
                  animation: pulse 2s infinite;
                "></div>
              ` : ''}
            </div>
          </div>
        `;

        const popupContent = createPopupContent(loc);
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          className: 'admin-provider-popup'
        }).setDOMContent(popupContent);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.set(loc.provider_id, { marker, popup, element: el });
      }
    });

    // Only fit bounds on initial load
    if (!initialFitDone.current && locations.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(loc => {
        bounds.extend([loc.longitude, loc.latitude]);
      });
      
      if (locations.length > 1) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
      } else {
        map.current.flyTo({
          center: [locations[0].longitude, locations[0].latitude],
          zoom: 12
        });
      }
      initialFitDone.current = true;
    }
  }, [locations, mapLoaded, createPopupContent, updateMarkerAppearance]);

  // Update client markers
  useEffect(() => {
    if (!map.current || !mapLoaded || !showClients) return;

    const currentIds = new Set(clientLocations.map(loc => loc.session_id));
    
    // Remove markers that are no longer present
    clientMarkers.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        clientMarkers.current.delete(id);
      }
    });

    // Add or update client markers
    clientLocations.forEach(loc => {
      const existing = clientMarkers.current.get(loc.session_id);
      
      if (existing) {
        existing.setLngLat([loc.longitude, loc.latitude]);
      } else {
        // Create client marker
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 15 })
          .setHTML(`
            <div style="background: #1e293b; padding: 8px; border-radius: 6px; color: white;">
              <div style="font-size: 11px; color: #94a3b8;">Cliente</div>
              <div style="font-size: 12px; font-weight: 500;">${loc.city || 'Desconhecido'}</div>
              ${loc.state_uf ? `<div style="font-size: 11px; color: #64748b;">${loc.state_uf}</div>` : ''}
              <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
                ${new Date(loc.last_seen_at).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        clientMarkers.current.set(loc.session_id, marker);
      }
    });
  }, [clientLocations, mapLoaded, showClients]);

  if (!mapboxToken) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 rounded-lg ${className}`}>
        <div className="text-slate-400 text-sm">Carregando mapa...</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      <style>{`
        .admin-provider-popup .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .admin-provider-popup .mapboxgl-popup-tip {
          border-top-color: #1e293b !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default AdminProvidersMap;