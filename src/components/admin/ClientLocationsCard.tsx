import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, MapPin, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface ClientLocation {
  id: string;
  session_id: string;
  latitude: number;
  longitude: number;
  region: string | null;
  city: string | null;
  state_uf: string | null;
  last_seen_at: string;
}

interface ClientLocationsCardProps {
  className?: string;
  onLocationsChange?: (locations: ClientLocation[]) => void;
}

const ClientLocationsCard: React.FC<ClientLocationsCardProps> = ({ className, onLocationsChange }) => {
  const [clients, setClients] = useState<ClientLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadClients = async () => {
    setLoading(true);
    try {
      // Get clients seen in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('client_locations')
        .select('*')
        .gte('last_seen_at', oneHourAgo)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      const clientsList = data || [];
      setClients(clientsList);
      onLocationsChange?.(clientsList);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('client-locations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_locations'
        },
        () => {
          loadClients();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(loadClients, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSec < 60) return `${diffSec}s`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}min`;
    return `${Math.floor(diffSec / 3600)}h`;
  };

  // Group clients by region
  const groupedClients = clients.reduce((acc, client) => {
    const region = client.city || client.state_uf || 'Desconhecido';
    if (!acc[region]) acc[region] = [];
    acc[region].push(client);
    return acc;
  }, {} as Record<string, ClientLocation[]>);

  const sortedRegions = Object.entries(groupedClients)
    .sort(([, a], [, b]) => b.length - a.length);

  const displayRegions = isExpanded ? sortedRegions : sortedRegions.slice(0, 2);

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-white text-sm font-medium">Clientes</span>
          <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 ml-1">
            {clients.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadClients}
          disabled={loading}
          className="text-slate-400 hover:text-white h-6 w-6 p-0"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-2">
        {loading && clients.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-xs">
            Nenhum cliente ativo
          </div>
        ) : (
          <div className="space-y-2">
            {displayRegions.map(([region, regionClients]) => (
              <div key={region} className="bg-slate-900/50 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {region}
                  </span>
                  <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400 h-4 px-1.5">
                    {regionClients.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {regionClients.slice(0, 4).map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 rounded text-[9px]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-slate-400">{formatTimeAgo(client.last_seen_at)}</span>
                    </div>
                  ))}
                  {regionClients.length > 4 && (
                    <span className="text-[9px] text-slate-500 px-1.5 py-0.5">
                      +{regionClients.length - 4}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expand/Collapse */}
      {sortedRegions.length > 2 && (
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
              Ver mais ({sortedRegions.length - 2} regiões)
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ClientLocationsCard;