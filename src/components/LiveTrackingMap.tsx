import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '@/contexts/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { Truck, User } from 'lucide-react';

interface OnlineProvider {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  estimatedTime?: number;
}

interface LiveTrackingMapProps {
  className?: string;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Estimate arrival time based on distance (assuming 40km/h average speed in urban areas)
function estimateArrivalTime(distanceKm: number): number {
  const averageSpeedKmH = 40;
  return Math.round((distanceKm / averageSpeedKmH) * 60);
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const clientMarker = useRef<mapboxgl.Marker | null>(null);
  const providerMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const routeLayerId = 'route-layer';
  
  const { location, mapboxToken, updateLocation } = useLocation();
  const [mapError, setMapError] = useState(false);
  const [onlineProviders, setOnlineProviders] = useState<OnlineProvider[]>([]);
  const [nearestProvider, setNearestProvider] = useState<OnlineProvider | null>(null);

  // Fetch online providers
  const fetchOnlineProviders = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('prestadores-online');
      
      if (error) {
        console.error('Error fetching online providers:', error);
        return;
      }

      if (data?.providers) {
        // Calculate distance for each provider
        const providersWithDistance = data.providers.map((p: OnlineProvider) => {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            p.latitude,
            p.longitude
          );
          return {
            ...p,
            distance,
            estimatedTime: estimateArrivalTime(distance),
          };
        }).sort((a: OnlineProvider, b: OnlineProvider) => (a.distance || 0) - (b.distance || 0));

        setOnlineProviders(providersWithDistance);
        
        if (providersWithDistance.length > 0) {
          setNearestProvider(providersWithDistance[0]);
        } else {
          setNearestProvider(null);
        }
      }
    } catch (err) {
      console.error('Error in fetchOnlineProviders:', err);
    }
  }, [location.latitude, location.longitude]);

  // Draw route to nearest provider
  const drawRoute = useCallback(async (providerLat: number, providerLng: number) => {
    if (!map.current || !mapboxToken) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${location.longitude},${location.latitude};${providerLng},${providerLat}?geometries=geojson&access_token=${mapboxToken}`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].geometry;

        // Remove existing route layer and source if they exist
        if (map.current.getLayer(routeLayerId)) {
          map.current.removeLayer(routeLayerId);
        }
        if (map.current.getSource('route')) {
          map.current.removeSource('route');
        }

        // Add new route
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route,
          },
        });

        map.current.addLayer({
          id: routeLayerId,
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#22c55e',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });
      }
    } catch (err) {
      console.error('Error drawing route:', err);
    }
  }, [location.latitude, location.longitude, mapboxToken]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) {
      setMapError(true);
      return;
    }

    setMapError(false);
    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/navigation-night-v1',
        center: [location.longitude, location.latitude],
        zoom: 14,
        pitch: 30,
        antialias: true,
        attributionControl: false,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.on('error', () => {
        setMapError(true);
      });

      map.current.on('load', () => {
        // Initial fetch of providers
        fetchOnlineProviders();
      });
    } catch (error) {
      setMapError(true);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Create/Update client marker (draggable)
  useEffect(() => {
    if (!map.current || location.loading || mapError) return;

    if (clientMarker.current) {
      clientMarker.current.setLngLat([location.longitude, location.latitude]);
    } else {
      // Create custom client marker element
      const el = document.createElement('div');
      el.className = 'client-marker';
      el.innerHTML = `
        <div style="
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          animation: pulse 2s ease-in-out infinite;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      `;

      clientMarker.current = new mapboxgl.Marker({ 
        element: el, 
        draggable: true 
      })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);

      // Handle drag end
      clientMarker.current.on('dragend', () => {
        const lngLat = clientMarker.current?.getLngLat();
        if (lngLat) {
          updateLocation(lngLat.lat, lngLat.lng);
        }
      });
    }

    // Center map on client location
    map.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 14,
      duration: 1000,
    });
  }, [location.latitude, location.longitude, location.loading, mapError, updateLocation]);

  // Update provider markers
  useEffect(() => {
    if (!map.current || mapError) return;

    // Remove old markers that are no longer online
    const currentProviderIds = new Set(onlineProviders.map(p => p.id));
    providerMarkers.current.forEach((marker, id) => {
      if (!currentProviderIds.has(id)) {
        marker.remove();
        providerMarkers.current.delete(id);
      }
    });

    // Add/update provider markers
    onlineProviders.forEach(provider => {
      const existingMarker = providerMarkers.current.get(provider.id);
      
      if (existingMarker) {
        existingMarker.setLngLat([provider.longitude, provider.latitude]);
        // Update popup content
        existingMarker.getPopup()?.setHTML(`
          <div style="padding: 8px; text-align: center;">
            <strong style="color: #1a1a2e;">${provider.name}</strong><br/>
            <span style="color: #22c55e; font-weight: bold;">${provider.distance?.toFixed(1)} km</span><br/>
            <span style="color: #666;">~${provider.estimatedTime} min</span>
          </div>
        `);
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'provider-marker';
        el.innerHTML = `
          <div style="
            position: relative;
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M9 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
              <path d="M13 16V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10"/>
              <path d="M17 16V8a1 1 0 0 0-1-1h-1"/>
              <path d="M5 16h8M10 16h7"/>
              <path d="M16 8h3l2 4v4h-5"/>
            </svg>
          </div>
          <div style="
            position: absolute;
            top: -35px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(26, 26, 46, 0.95);
            color: white;
            padding: 4px 8px;
            border-radius: 8px;
            font-size: 11px;
            white-space: nowrap;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          ">
            <span style="color: #22c55e; font-weight: bold;">${provider.distance?.toFixed(1)} km</span>
            <span style="margin-left: 6px; color: #94a3b8;">~${provider.estimatedTime} min</span>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px; text-align: center;">
            <strong style="color: #1a1a2e;">${provider.name}</strong><br/>
            <span style="color: #22c55e; font-weight: bold;">${provider.distance?.toFixed(1)} km</span><br/>
            <span style="color: #666;">~${provider.estimatedTime} min</span>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([provider.longitude, provider.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        providerMarkers.current.set(provider.id, marker);
      }
    });

    // Draw route to nearest provider
    if (nearestProvider) {
      drawRoute(nearestProvider.latitude, nearestProvider.longitude);
    }
  }, [onlineProviders, nearestProvider, mapError, drawRoute]);

  // Poll for online providers every 5 seconds
  useEffect(() => {
    if (location.loading) return;

    const interval = setInterval(fetchOnlineProviders, 5000);
    return () => clearInterval(interval);
  }, [fetchOnlineProviders, location.loading]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('provider-online-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'provider_online_status'
        },
        () => {
          fetchOnlineProviders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOnlineProviders]);

  if (mapError || !mapboxToken) {
    return (
      <div className={`${className} bg-[#0a0f1a] flex items-center justify-center`}>
        <div className="text-center p-4">
          <p className="text-muted-foreground text-sm">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      <div ref={mapContainer} className="w-full h-full rounded-2xl overflow-hidden" />
      
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 bg-[#0a0f1a]/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <span className="text-white">Você (arraste para ajustar)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
              <Truck className="w-3 h-3 text-white" />
            </div>
            <span className="text-white">Guincheiros online ({onlineProviders.length})</span>
          </div>
        </div>
      </div>

      {/* Nearest provider info */}
      {nearestProvider && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-[#0a0f1a]/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Truck className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{nearestProvider.name}</p>
                <p className="text-muted-foreground text-xs">Guincheiro mais próximo</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-bold">{nearestProvider.distance?.toFixed(1)} km</p>
              <p className="text-muted-foreground text-xs">~{nearestProvider.estimatedTime} min</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default LiveTrackingMap;
