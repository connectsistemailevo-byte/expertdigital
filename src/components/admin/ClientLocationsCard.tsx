import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, MapPin, Loader2 } from 'lucide-react';

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

  return (
    <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Clientes Ativos ({clients.length})
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadClients}
            disabled={loading}
            className="text-slate-400 hover:text-white h-7"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[300px] overflow-y-auto">
        {loading && clients.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum cliente ativo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedClients)
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([region, regionClients]) => (
                <div key={region}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {region}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                      {regionClients.length}
                    </Badge>
                  </div>
                  <div className="space-y-1 pl-4">
                    {regionClients.slice(0, 5).map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-1.5 bg-slate-900/50 rounded text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-slate-300 truncate max-w-[120px]">
                            {client.session_id.slice(-8)}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[10px]">
                          {formatTimeAgo(client.last_seen_at)}
                        </span>
                      </div>
                    ))}
                    {regionClients.length > 5 && (
                      <div className="text-[10px] text-slate-500 text-center py-1">
                        +{regionClients.length - 5} mais
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientLocationsCard;