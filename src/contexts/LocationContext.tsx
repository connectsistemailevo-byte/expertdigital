import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  region: string;
  accuracy: number | null;
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
    latitude: 0,
    longitude: 0,
    address: 'Buscando sua localização...',
    region: 'Aguarde...',
    accuracy: null,
    loading: true,
    error: null,
  });

  const setMapboxToken = (token: string) => {
    setMapboxTokenState(token);
    localStorage.setItem(STORAGE_KEY, token);
  };

  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number): Promise<{ address: string; region: string }> => {
    // Primeiro tenta com Mapbox se tiver token
    if (mapboxToken) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=pt&types=address,poi,neighborhood,locality,place&limit=1`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const place = data.features[0];
          const context = place.context || [];
          
          const street = place.text || '';
          const number = place.address || '';
          const neighborhood = context.find((c: any) => c.id.includes('neighborhood'))?.text || '';
          const locality = context.find((c: any) => c.id.includes('locality'))?.text || '';
          const city = context.find((c: any) => c.id.includes('place'))?.text || '';
          const state = context.find((c: any) => c.id.includes('region'))?.short_code?.replace('BR-', '') || '';
          
          // Monta endereço mais completo
          let address = place.place_name || '';
          if (!address && street) {
            const parts = [street, number, neighborhood, city].filter(Boolean);
            address = parts.join(', ');
          }
          
          const region = city && state ? `${city}, ${state}` : (locality || neighborhood || 'Brasil');
          
          return { address, region };
        }
      } catch (error) {
        console.error('Mapbox geocoding error:', error);
      }
    }
    
    // Fallback: usa API gratuita do Nominatim (OpenStreetMap)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=pt-BR`,
        {
          headers: {
            'User-Agent': 'AcheiGuincho/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.pedestrian || addr.street || '';
        const number = addr.house_number || '';
        const neighborhood = addr.suburb || addr.neighbourhood || addr.district || '';
        const city = addr.city || addr.town || addr.municipality || addr.village || '';
        const state = addr.state || '';
        
        const addressParts = [street, number, neighborhood, city].filter(Boolean);
        const address = addressParts.length > 0 ? addressParts.join(', ') : data.display_name;
        const region = city && state ? `${city}, ${state}` : (city || state || 'Brasil');
        
        return { address, region };
      }
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
    }
    
    // Se nada funcionar, retorna coordenadas
    return { 
      address: `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 
      region: 'Localização obtida' 
    };
  }, [mapboxToken]);

  const fetchLocation = useCallback(async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocalização não suportada pelo navegador',
      }));
      return;
    }

    // Tenta obter localização com alta precisão
    const getPosition = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          }
        );
      });
    };

    try {
      const position = await getPosition();
      const { latitude, longitude, accuracy } = position.coords;
      
      console.log('Localização obtida:', { latitude, longitude, accuracy });
      
      const { address, region } = await getAddressFromCoordinates(latitude, longitude);
      
      setLocation({
        latitude,
        longitude,
        address,
        region,
        accuracy,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Geolocation error:', error);
      
      let errorMsg = 'Não foi possível obter sua localização.';
      if (error.code === 1) {
        errorMsg = 'Por favor, permita o acesso à localização no navegador.';
      } else if (error.code === 2) {
        errorMsg = 'Localização indisponível. Verifique se o GPS está ativo.';
      } else if (error.code === 3) {
        errorMsg = 'Tempo esgotado. Tente novamente.';
      }
      
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));
    }
  }, [getAddressFromCoordinates]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return (
    <LocationContext.Provider value={{ location, refreshLocation: fetchLocation, mapboxToken, setMapboxToken }}>
      {children}
    </LocationContext.Provider>
  );
};
