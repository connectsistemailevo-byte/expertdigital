import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  updateLocation: (lat: number, lng: number) => Promise<void>;
  mapboxToken: string;
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
  const [mapboxToken, setMapboxToken] = useState('');

  const [location, setLocation] = useState<LocationData>({
    latitude: 0,
    longitude: 0,
    address: 'Buscando sua localização...',
    region: 'Aguarde...',
    accuracy: null,
    loading: true,
    error: null,
  });

  // Busca o token do Mapbox da edge function
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) {
          console.warn('Mapbox token not available, using fallback geocoding:', error);
          return;
        }
        if (data?.token) {
          setMapboxToken(data.token);
          console.log('Mapbox token loaded successfully');
        }
      } catch (err) {
        console.warn('Error fetching Mapbox token, using fallback:', err);
      }
    };
    fetchMapboxToken();
  }, []);

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

  // Função para atualizar localização manualmente (quando usuário arrasta o marcador)
  const updateLocation = useCallback(async (lat: number, lng: number) => {
    setLocation(prev => ({ ...prev, loading: true }));
    
    const { address, region } = await getAddressFromCoordinates(lat, lng);
    
    setLocation({
      latitude: lat,
      longitude: lng,
      address,
      region,
      accuracy: null,
      loading: false,
      error: null,
    });
  }, [getAddressFromCoordinates]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return (
    <LocationContext.Provider value={{ location, refreshLocation: fetchLocation, updateLocation, mapboxToken }}>
      {children}
    </LocationContext.Provider>
  );
};
