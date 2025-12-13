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

interface AdminProvidersMapProps {
  locations: ProviderLocation[];
  className?: string;
  onToggleOnline?: (providerId: string, isOnline: boolean) => void;
}

const AdminProvidersMap: React.FC<AdminProvidersMapProps> = ({ locations, className, onToggleOnline }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, { marker: mapboxgl.Marker; popup: mapboxgl.Popup; element: HTMLDivElement }>>(new Map());
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const initialFitDone = useRef(false);
  const locationsRef = useRef<ProviderLocation[]>(locations);

  // Keep ref updated
  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

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

  // Create popup content without recreating the marker
  const createPopupContent = useCallback((loc: ProviderLocation) => {
    const popupContent = document.createElement('div');
    popupContent.innerHTML = `
      <div style="
        background: #1e293b;
        padding: 12px;
        border-radius: 8px;
        color: white;
        min-width: 200px;
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
        <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
          ${loc.last_seen_at ? `Atualizado: ${new Date(loc.last_seen_at).toLocaleTimeString('pt-BR')}` : 'Sem registro'}
        </div>
        <button 
          class="toggle-btn"
          style="
            width: 100%;
            padding: 6px 12px;
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
  }, [onToggleOnline]);

  // Update marker appearance without recreating
  const updateMarkerAppearance = useCallback((element: HTMLDivElement, isOnline: boolean) => {
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
      map.current?.remove();
      map.current = null;
      initialFitDone.current = false;
    };
  }, [mapboxToken]);

  // Update markers when locations change - SILENTLY without disrupting the view
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
        
        // Update marker appearance based on online status
        updateMarkerAppearance(existing.element, loc.is_online);
        
        // Update popup content
        const newContent = createPopupContent(loc);
        existing.popup.setDOMContent(newContent);
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'admin-provider-marker';
        el.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            background: ${loc.is_online ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #64748b, #475569)'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            border: 3px solid ${loc.is_online ? '#22c55e' : '#64748b'};
            cursor: pointer;
            position: relative;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M5 17h14v2H5zM19 13H5v-4a7 7 0 0 1 14 0v4z"/>
              <circle cx="7.5" cy="17" r="1.5"/>
              <circle cx="16.5" cy="17" r="1.5"/>
            </svg>
            ${loc.is_online ? `
              <div class="pulse-indicator" style="
                position: absolute;
                top: -2px;
                right: -2px;
                width: 12px;
                height: 12px;
                background: #22c55e;
                border-radius: 50%;
                border: 2px solid #1a1f2e;
                animation: pulse 2s infinite;
              "></div>
            ` : ''}
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

    // Only fit bounds on initial load, not on every update
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
