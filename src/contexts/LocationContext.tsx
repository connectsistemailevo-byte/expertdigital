import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  region: string;
  distance: number | null;
  loading: boolean;
  error: string | null;
}

interface LocationContextType {
  location: LocationData;
  refreshLocation: () => void;
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

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<LocationData>({
    latitude: -23.5505,
    longitude: -46.6333,
    address: 'Carregando localização...',
    region: 'São Paulo, SP',
    distance: null,
    loading: true,
    error: null,
  });

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1IjoibG92YWJsZWFpIiwiYSI6ImNtYXk3d3Q2djA1aWUya3B5ZG9pNnRwc2YifQ.ra-Gthd7huNGyGv9t3fWPQ&language=pt`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const context = place.context || [];
        
        const neighborhood = context.find((c: any) => c.id.includes('neighborhood'))?.text || '';
        const locality = context.find((c: any) => c.id.includes('locality'))?.text || '';
        const city = context.find((c: any) => c.id.includes('place'))?.text || 'São Paulo';
        const state = context.find((c: any) => c.id.includes('region'))?.short_code?.replace('BR-', '') || 'SP';
        
        const address = place.place_name || `${neighborhood}, ${city}`;
        const region = `${locality || neighborhood || city}, ${state}`;
        
        return { address, region };
      }
      return { address: 'Localização encontrada', region: 'São Paulo, SP' };
    } catch (error) {
      console.error('Error getting address:', error);
      return { address: 'Localização encontrada', region: 'São Paulo, SP' };
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
        const { address, region } = await getAddressFromCoordinates(latitude, longitude);
        
        setLocation({
          latitude,
          longitude,
          address,
          region,
          distance: null,
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: 'Não foi possível obter sua localização. Por favor, permita o acesso.',
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ location, refreshLocation: fetchLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
