import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, MapPin, Navigation, Clock, Loader2, Route } from 'lucide-react';

interface Simulation {
  id: string;
  session_id: string;
  origin_latitude: number;
  origin_longitude: number;
  origin_address: string | null;
  destination_latitude: number;
  destination_longitude: number;
  destination_address: string | null;
  distance_km: number | null;
  duration_min: number | null;
  created_at: string;
}

interface SimulationsHistoryProps {
  className?: string;
}

const SimulationsHistory: React.FC<SimulationsHistoryProps> = ({ className }) => {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSimulations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('route_simulations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSimulations(data || []);
    } catch (err) {
      console.error('Error loading simulations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSimulations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('simulations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'route_simulations'
        },
        (payload) => {
          setSimulations(prev => [payload.new as Simulation, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateAddress = (address: string | null, maxLen = 40) => {
    if (!address) return 'Endereço não disponível';
    return address.length > maxLen ? address.substring(0, maxLen) + '...' : address;
  };

  // Group simulations by date
  const groupedSimulations = simulations.reduce((acc, sim) => {
    const date = new Date(sim.created_at).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(sim);
    return acc;
  }, {} as Record<string, Simulation[]>);

  return (
    <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-blue-400" />
            Histórico de Simulações
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadSimulations}
            disabled={loading}
            className="text-slate-400 hover:text-white h-7"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        {loading && simulations.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : simulations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Navigation className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma simulação registrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSimulations).map(([date, sims]) => (
              <div key={date}>
                <div className="text-xs font-semibold text-slate-400 mb-2 sticky top-0 bg-slate-800/90 py-1">
                  {date}
                </div>
                <div className="space-y-2">
                  {sims.map((sim) => (
                    <div
                      key={sim.id}
                      className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          {new Date(sim.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {sim.distance_km && sim.duration_min && (
                          <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                            {sim.distance_km.toFixed(1)} km • {sim.duration_min} min
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-slate-500">Origem</div>
                            <div className="text-xs text-white truncate" title={sim.origin_address || ''}>
                              {truncateAddress(sim.origin_address)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-slate-500">Destino</div>
                            <div className="text-xs text-white truncate" title={sim.destination_address || ''}>
                              {truncateAddress(sim.destination_address)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimulationsHistory;