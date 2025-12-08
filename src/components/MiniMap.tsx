import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '@/contexts/LocationContext';

interface MiniMapProps {
  className?: string;
}

const MiniMap: React.FC<MiniMapProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { location, mapboxToken } = useLocation();
  const [mapReady, setMapReady] = useState(false);

  // Initialize map when token is available and location is ready
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || location.loading) return;
    if (location.latitude === 0 && location.longitude === 0) return;

    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
      marker.current = null;
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [location.longitude, location.latitude],
        zoom: 16,
        interactive: true,
        dragPan: true,
        scrollZoom: false,
        doubleClickZoom: true,
      });

      map.current.on('load', () => {
        setMapReady(true);
        
        // Add marker after map loads
        if (map.current) {
          const el = document.createElement('div');
          el.innerHTML = `
            <div class="marker-container" style="
              position: relative;
              width: 40px;
              height: 40px;
            ">
              <div style="
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #f5a623, #f7b731);
                border-radius: 50% 50% 50% 0;
                transform: translateX(-50%) rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 4px 15px rgba(245, 166, 35, 0.6);
              "></div>
              <div style="
                position: absolute;
                bottom: 8px;
                left: 50%;
                transform: translateX(-50%);
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
              "></div>
              <div style="
                position: absolute;
                bottom: -5px;
                left: 50%;
                transform: translateX(-50%);
                width: 20px;
                height: 8px;
                background: rgba(0,0,0,0.2);
                border-radius: 50%;
                filter: blur(2px);
              "></div>
            </div>
          `;

          marker.current = new mapboxgl.Marker({ 
            element: el,
            anchor: 'bottom'
          })
            .setLngLat([location.longitude, location.latitude])
            .addTo(map.current);
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

    } catch (error) {
      console.error('Error initializing mini map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
    };
  }, [mapboxToken, location.latitude, location.longitude, location.loading]);

  // Update marker position when location changes
  useEffect(() => {
    if (marker.current && map.current && mapReady && !location.loading) {
      marker.current.setLngLat([location.longitude, location.latitude]);
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 16,
        duration: 1000,
      });
    }
  }, [location.latitude, location.longitude, location.loading, mapReady]);

  // Show placeholder when no token
  if (!mapboxToken) {
    return (
      <div className={`${className} bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center`}>
        <div className="text-center p-4">
          <div className="w-14 h-14 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">Mapa indisponível</p>
          <p className="text-xs text-muted-foreground mt-1">Configure o token Mapbox</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (location.loading || (location.latitude === 0 && location.longitude === 0)) {
    return (
      <div className={`${className} bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center`}>
        <div className="text-center p-4">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Obtendo localização...</p>
          <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default MiniMap;
