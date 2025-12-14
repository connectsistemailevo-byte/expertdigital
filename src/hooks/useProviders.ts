import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/contexts/LocationContext';

export interface Provider {
  id: string;
  name: string;
  whatsapp: string;
  has_patins: boolean;
  service_types: string[];
  latitude: number;
  longitude: number;
  address: string | null;
  region: string | null;
  base_price: number;
  price_per_km: number;
  patins_extra_price: number;
  distance?: number;
  estimatedTime?: number;
  estimatedPrice?: number;
  last_seen_at?: string;
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

export function useProviders(maxDistanceKm: number = 500) {
  const { location } = useLocation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    if (location.loading || location.error) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch ONLY online providers from the edge function
      const { data, error: fetchError } = await supabase.functions.invoke('prestadores-online');

      if (fetchError) throw fetchError;

      const onlineProviders = data?.providers || [];

      if (onlineProviders.length === 0) {
        setProviders([]);
        return;
      }

      // Calculate distance and price for each provider and filter by max distance
      const providersWithDistance = onlineProviders
        .map((provider: any) => {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            provider.latitude,
            provider.longitude
          );
          const basePrice = provider.base_price || 50;
          const pricePerKm = provider.price_per_km || 5;
          const estimatedPrice = basePrice + (distance * pricePerKm);
          return {
            ...provider,
            address: null, // Online providers don't have address in response
            region: null,
            distance,
            estimatedTime: estimateArrivalTime(distance),
            estimatedPrice,
          };
        })
        .filter((provider: Provider) => provider.distance <= maxDistanceKm)
        .sort((a: Provider, b: Provider) => (a.distance || 0) - (b.distance || 0));

      setProviders(providersWithDistance);
    } catch (err: any) {
      console.error('Error fetching online providers:', err);
      setError(err.message || 'Erro ao buscar prestadores');
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude, location.loading, location.error, maxDistanceKm]);

  useEffect(() => {
    fetchProviders();

    // Poll for online providers every 10 seconds
    const interval = setInterval(() => {
      fetchProviders();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchProviders]);

  return { providers, loading, error, refetch: fetchProviders };
}
