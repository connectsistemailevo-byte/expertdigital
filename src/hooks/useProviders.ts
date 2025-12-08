import { useState, useEffect } from 'react';
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

export function useProviders(maxDistanceKm: number = 50) {
  const { location } = useLocation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProviders() {
      if (location.loading || location.error) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('providers')
          .select('*');

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          setProviders([]);
          return;
        }

        // Calculate distance and price for each provider and filter by max distance
        const providersWithDistance = data
          .map(provider => {
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
              distance,
              estimatedTime: estimateArrivalTime(distance),
              estimatedPrice,
            };
          })
          .filter(provider => provider.distance <= maxDistanceKm)
          .sort((a, b) => a.distance - b.distance);

        setProviders(providersWithDistance);
      } catch (err: any) {
        console.error('Error fetching providers:', err);
        setError(err.message || 'Erro ao buscar prestadores');
      } finally {
        setLoading(false);
      }
    }

    fetchProviders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('providers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'providers'
        },
        () => {
          fetchProviders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location.latitude, location.longitude, location.loading, location.error, maxDistanceKm]);

  return { providers, loading, error };
}
