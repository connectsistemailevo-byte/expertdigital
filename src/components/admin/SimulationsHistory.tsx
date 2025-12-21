import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, MapPin, Clock, Loader2, Route, ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [isExpanded, setIsExpanded] = useState(false);

  const loadSimulations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('route_simulations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

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
          setSimulations(prev => [payload.new as Simulation, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateAddress = (address: string | null, maxLen = 30) => {
    if (!address) return 'Endereço não disponível';
    return address.length > maxLen ? address.substring(0, maxLen) + '...' : address;
  };

  const displaySimulations = isExpanded ? simulations : simulations.slice(0, 3);

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-blue-400" />
          <span className="text-white text-sm font-medium">Simulações</span>
          <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 ml-1">
            {simulations.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadSimulations}
          disabled={loading}
          className="text-slate-400 hover:text-white h-6 w-6 p-0"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-2">
        {loading && simulations.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : simulations.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-xs">
            Nenhuma simulação
          </div>
        ) : (
          <div className="space-y-1.5">
            {displaySimulations.map((sim) => (
              <div
                key={sim.id}
                className="p-2 bg-slate-900/50 rounded border border-slate-700/30 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    {formatTime(sim.created_at)}
                  </div>
                  {sim.distance_km && (
                    <span className="text-[9px] text-blue-400 font-medium">
                      {sim.distance_km.toFixed(1)}km
                    </span>
                  )}
                </div>
                
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-[10px] text-slate-300 truncate">
                      {truncateAddress(sim.origin_address)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-2 h-2 text-red-500 flex-shrink-0" />
                    <span className="text-[10px] text-slate-300 truncate">
                      {truncateAddress(sim.destination_address)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expand/Collapse */}
      {simulations.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-slate-400 hover:text-white border-t border-slate-700/50 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Recolher
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Ver mais ({simulations.length - 3})
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default SimulationsHistory;