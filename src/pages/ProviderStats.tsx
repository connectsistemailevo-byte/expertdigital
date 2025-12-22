import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  QrCode, 
  ArrowLeft, 
  Loader2, 
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react';

interface ScanStats {
  total_scans: number;
  today_scans: number;
  week_scans: number;
  month_scans: number;
}

interface DailyScan {
  date: string;
  count: number;
}

export default function ProviderStats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [dailyScans, setDailyScans] = useState<DailyScan[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string>('');

  useEffect(() => {
    const savedWhatsapp = localStorage.getItem('provider_whatsapp');
    if (!savedWhatsapp) {
      navigate('/provider-dashboard');
      return;
    }

    loadProviderAndStats(savedWhatsapp);
  }, [navigate]);

  const loadProviderAndStats = async (whatsapp: string) => {
    try {
      // Buscar provider
      const cleanPhone = whatsapp.replace(/\D/g, '');
      const last4 = cleanPhone.slice(-4);
      const secondToLast4 = cleanPhone.slice(-8, -4);
      const searchPattern = `%${secondToLast4}%${last4}%`;

      const { data: providers } = await supabase
        .from('providers')
        .select('id, name')
        .ilike('whatsapp', searchPattern)
        .limit(1);

      if (!providers || providers.length === 0) {
        navigate('/provider-dashboard');
        return;
      }

      const provider = providers[0];
      setProviderId(provider.id);
      setProviderName(provider.name);

      // Buscar estatísticas
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(todayStart);
      monthStart.setDate(monthStart.getDate() - 30);

      // Total de scans
      const { count: totalCount } = await supabase
        .from('qr_code_scans')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', provider.id);

      // Scans hoje
      const { count: todayCount } = await supabase
        .from('qr_code_scans')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', provider.id)
        .gte('scanned_at', todayStart.toISOString());

      // Scans semana
      const { count: weekCount } = await supabase
        .from('qr_code_scans')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', provider.id)
        .gte('scanned_at', weekStart.toISOString());

      // Scans mês
      const { count: monthCount } = await supabase
        .from('qr_code_scans')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', provider.id)
        .gte('scanned_at', monthStart.toISOString());

      setStats({
        total_scans: totalCount || 0,
        today_scans: todayCount || 0,
        week_scans: weekCount || 0,
        month_scans: monthCount || 0
      });

      // Buscar scans dos últimos 7 dias
      const { data: scansData } = await supabase
        .from('qr_code_scans')
        .select('scanned_at')
        .eq('provider_id', provider.id)
        .gte('scanned_at', weekStart.toISOString())
        .order('scanned_at', { ascending: true });

      // Agrupar por dia
      const scansByDay: { [key: string]: number } = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(todayStart);
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        scansByDay[dateStr] = 0;
      }

      scansData?.forEach(scan => {
        const dateStr = new Date(scan.scanned_at).toISOString().split('T')[0];
        if (scansByDay[dateStr] !== undefined) {
          scansByDay[dateStr]++;
        }
      });

      setDailyScans(
        Object.entries(scansByDay).map(([date, count]) => ({ date, count }))
      );

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxScanCount = Math.max(...dailyScans.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/provider-dashboard')}
            className="border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Estatísticas do QR Code
            </h1>
            <p className="text-slate-400 text-sm">{providerName}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-2">
                <Eye className="w-3 h-3" />
                Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.today_scans || 0}</div>
              <p className="text-xs text-slate-500">escaneamentos</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Última Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.week_scans || 0}</div>
              <p className="text-xs text-slate-500">escaneamentos</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                Último Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.month_scans || 0}</div>
              <p className="text-xs text-slate-500">escaneamentos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-purple-300 flex items-center gap-2">
                <QrCode className="w-3 h-3" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.total_scans || 0}</div>
              <p className="text-xs text-purple-300">escaneamentos</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Escaneamentos dos Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {dailyScans.map((day, index) => {
                const height = (day.count / maxScanCount) * 100;
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-white font-medium">{day.count}</span>
                    <div 
                      className="w-full bg-gradient-to-t from-purple-500 to-indigo-500 rounded-t transition-all duration-500"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-[10px] text-slate-400 capitalize">{dayName}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Dica para mais escaneamentos</h3>
                <p className="text-sm text-slate-300">
                  Cole seu QR Code no para-brisa do guincho, cartões de visita e materiais de divulgação. 
                  Quanto mais visível, mais clientes diretos você terá!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
