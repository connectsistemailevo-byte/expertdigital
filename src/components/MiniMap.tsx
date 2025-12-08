import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || location.loading) return;

    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [location.longitude, location.latitude],
        zoom: 15,
        interactive: false,
      });

      // Create custom marker
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #f5a623, #f7b731);
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(245, 166, 35, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s ease-in-out infinite;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      marker.current = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);

    } catch (error) {
      console.error('Error initializing mini map:', error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, location.latitude, location.longitude, location.loading]);

  if (!mapboxToken) {
    return (
      <div className={`${className} bg-muted rounded-xl flex items-center justify-center`}>
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <p className="text-xs text-muted-foreground">Mapa indisponível</p>
        </div>
      </div>
    );
  }

  if (location.loading) {
    return (
      <div className={`${className} bg-muted rounded-xl flex items-center justify-center`}>
        <div className="text-center p-4">
          <div className="w-8 h-8 border-3 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};

export default MiniMap;
