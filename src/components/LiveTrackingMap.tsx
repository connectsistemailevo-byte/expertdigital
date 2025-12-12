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
        // Update label content
        const labelEl = existingMarker.getElement().querySelector('.provider-label');
        if (labelEl) {
          labelEl.innerHTML = `
            <span style="color: #22c55e; font-weight: 700;">${provider.distance?.toFixed(1)} km</span>
            <span style="color: #94a3b8;">~${provider.estimatedTime} min</span>
          `;
        }
      } else {
        // Create new marker with visible label
        const el = document.createElement('div');
        el.className = 'provider-marker';
        el.style.cssText = 'position: relative; display: flex; flex-direction: column; align-items: center;';
        el.innerHTML = `
          <div class="provider-label" style="
            background: rgba(10, 15, 26, 0.95);
            color: white;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <span style="color: #22c55e; font-weight: 700;">${provider.distance?.toFixed(1)} km</span>
            <span style="color: #94a3b8;">~${provider.estimatedTime} min</span>
          </div>
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 3px 12px rgba(245, 158, 11, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M9 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
              <path d="M13 16V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10"/>
              <path d="M17 16V8a1 1 0 0 0-1-1h-1"/>
              <path d="M5 16h8M10 16h7"/>
              <path d="M16 8h3l2 4v4h-5"/>
            </svg>
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([provider.longitude, provider.latitude])
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
      
      {/* Compact Legend */}
      <div className="absolute top-2 left-2 z-10 bg-[#0a0f1a]/80 backdrop-blur-sm rounded-md px-2 py-1 shadow-lg">
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-white/80">Você</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
              <Truck className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-white/80">Online ({onlineProviders.length})</span>
          </div>
        </div>
      </div>

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
