import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  region: string;
  loading: boolean;
  error: string | null;
}

interface LocationContextType {
  location: LocationData;
  refreshLocation: () => void;
  mapboxToken: string;
  setMapboxToken: (token: string) => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'achei_guincho_mapbox_token';

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [mapboxToken, setMapboxTokenState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });

  const [location, setLocation] = useState<LocationData>({
    latitude: -16.6869,
    longitude: -49.2648,
    address: 'Aguardando localização...',
    region: 'Brasil',
    loading: true,
    error: null,
  });

  const setMapboxToken = (token: string) => {
    setMapboxTokenState(token);
    localStorage.setItem(STORAGE_KEY, token);
  };

  const getAddressFromCoordinates = async (lat: number, lng: number, token: string) => {
    if (!token) {
      return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, region: 'Localização capturada' };
    }
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=pt&country=BR`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const context = place.context || [];
        
        const neighborhood = context.find((c: any) => c.id.includes('neighborhood'))?.text || '';
        const locality = context.find((c: any) => c.id.includes('locality'))?.text || '';
        const city = context.find((c: any) => c.id.includes('place'))?.text || '';
        const state = context.find((c: any) => c.id.includes('region'))?.short_code?.replace('BR-', '') || '';
        
        const addressParts = [neighborhood, locality, city].filter(Boolean);
        const address = place.place_name || addressParts.join(', ');
        const region = city && state ? `${city}, ${state}` : 'São Paulo, SP';
        
        return { address, region };
      }
      return { address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`, region: 'Brasil' };
    } catch (error) {
      console.error('Error getting address:', error);
      return { address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`, region: 'Brasil' };
    }
  };

  const fetchLocation = async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocalização não suportada pelo navegador',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const { address, region } = await getAddressFromCoordinates(latitude, longitude, mapboxToken);
        
        setLocation({
          latitude,
          longitude,
          address,
          region,
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Não foi possível obter sua localização.';
        if (error.code === 1) {
          errorMsg = 'Permita o acesso à localização no navegador.';
        } else if (error.code === 2) {
          errorMsg = 'Localização indisponível no momento.';
        } else if (error.code === 3) {
          errorMsg = 'Tempo esgotado ao buscar localização.';
        }
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, [mapboxToken]);

  return (
    <LocationContext.Provider value={{ location, refreshLocation: fetchLocation, mapboxToken, setMapboxToken }}>
      {children}
    </LocationContext.Provider>
  );
};
