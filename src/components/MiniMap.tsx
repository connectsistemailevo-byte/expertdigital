import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '@/contexts/LocationContext';
import { Crosshair } from 'lucide-react';
import showtimeLogo from '@/assets/showtime-logo.png';

interface MiniMapProps {
  className?: string;
}

const MiniMap: React.FC<MiniMapProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { location, mapboxToken, updateLocation, refreshLocation } = useLocation();
  const [mapReady, setMapReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
        attributionControl: false,
      });

      map.current.on('load', () => {
        setMapReady(true);
        
        // Add draggable marker after map loads
        if (map.current) {
          const el = document.createElement('div');
          el.innerHTML = `
            <div class="marker-container" style="
              position: relative;
              width: 40px;
              height: 50px;
              cursor: grab;
            ">
              <div style="
                position: absolute;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #f5a623, #f7b731);
                border-radius: 50% 50% 50% 0;
                transform: translateX(-50%) rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 4px 15px rgba(245, 166, 35, 0.6);
                transition: transform 0.15s ease;
              " class="marker-pin"></div>
              <div style="
                position: absolute;
                bottom: 18px;
                left: 50%;
                transform: translateX(-50%);
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
              "></div>
              <div style="
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 20px;
                height: 8px;
                background: rgba(0,0,0,0.25);
                border-radius: 50%;
                filter: blur(2px);
              " class="marker-shadow"></div>
              <div style="
                position: absolute;
                top: -24px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.75);
                color: white;
                font-size: 9px;
                padding: 2px 6px;
                border-radius: 4px;
                white-space: nowrap;
                pointer-events: none;
              ">Arraste para ajustar</div>
            </div>
          `;
          el.style.cursor = 'grab';

          marker.current = new mapboxgl.Marker({ 
            element: el,
            anchor: 'bottom',
            draggable: true
          })
            .setLngLat([location.longitude, location.latitude])
            .addTo(map.current);

          // Handle drag events
          marker.current.on('dragstart', () => {
            setIsDragging(true);
            el.style.cursor = 'grabbing';
            const pin = el.querySelector('.marker-pin') as HTMLElement;
            if (pin) {
              pin.style.transform = 'translateX(-50%) rotate(-45deg) scale(1.1)';
            }
          });

          marker.current.on('dragend', async () => {
            setIsDragging(false);
            el.style.cursor = 'grab';
            const pin = el.querySelector('.marker-pin') as HTMLElement;
            if (pin) {
              pin.style.transform = 'translateX(-50%) rotate(-45deg) scale(1)';
            }
            
            // Get new coordinates and update location
            if (marker.current) {
              const lngLat = marker.current.getLngLat();
              await updateLocation(lngLat.lat, lngLat.lng);
            }
          });
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
  }, [mapboxToken, location.latitude, location.longitude, location.loading, updateLocation]);

  // Update marker position when location changes (but not during drag)
  useEffect(() => {
    if (marker.current && map.current && mapReady && !location.loading && !isDragging) {
      marker.current.setLngLat([location.longitude, location.latitude]);
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 16,
        duration: 1000,
      });
    }
  }, [location.latitude, location.longitude, location.loading, mapReady, isDragging]);

  // Handle GPS center button click
  const handleCenterOnGPS = () => {
    refreshLocation();
  };

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
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <img src={showtimeLogo} alt="ShowTime Creative" className="w-4 h-4" />
            <span className="text-xs text-muted-foreground">ShowTime Creative</span>
          </div>
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
    <div className={`${className} relative min-h-[160px]`} style={{ minHeight: '160px' }}>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ minHeight: '160px' }} />
      
      {/* GPS Center Button */}
      <button
        onClick={handleCenterOnGPS}
        className="absolute top-2 right-2 z-10 w-8 h-8 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        title="Centralizar na localização GPS"
      >
        <Crosshair className="w-4 h-4 text-blue-600" />
      </button>
      
      {/* ShowTime Creative Branding */}
      <div className="absolute bottom-1 left-1 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm">
        <img src={showtimeLogo} alt="ShowTime Creative" className="w-3.5 h-3.5" />
        <span className="text-[8px] font-medium text-gray-700">ShowTime Creative</span>
      </div>
      
      {isDragging && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full z-10">
          Solte para definir localização
        </div>
      )}
    </div>
  );
};

export default MiniMap;