import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Users,
  Loader2,
  RefreshCw,
  Play,
  Pause,
  Zap,
  Crown,
  Rocket,
  RotateCcw,
  Lock,
  Settings,
  Phone,
  MapPin,
  TrendingUp,
  Ban,
  Palette,
  UserPlus,
  Truck,
  Edit,
  MapPinned,
  Navigation,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import BrandingManager from '@/components/admin/BrandingManager';
import AdminProvidersMap from '@/components/admin/AdminProvidersMap';

interface ProviderWithSubscription {
  id: string;
  name: string;
  whatsapp: string;
  slug: string | null;
  address: string | null;
  region: string | null;
  created_at: string;
  base_price?: number;
  price_per_km?: number;
  patins_extra_price?: number;
  has_patins?: boolean;
  service_types?: string[];
  latitude?: number;
  longitude?: number;
  provider_subscriptions: {
    id: string;
    plano: 'basico' | 'profissional' | 'pro' | null;
    adesao_paga: boolean;
    trial_ativo: boolean;
    trial_corridas_restantes: number;
    corridas_usadas: number;
    limite_corridas: number;
    mensalidade_atual: number;
  }[] | null;
}

interface ProviderLocation {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_whatsapp: string;
  latitude: number;
  longitude: number;
  is_online: boolean;
  last_seen_at: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [providers, setProviders] = useState<ProviderWithSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal states
  const [showSetRidesModal, setShowSetRidesModal] = useState(false);
  const [showActivatePlanModal, setShowActivatePlanModal] = useState(false);
  const [showCreateProviderModal, setShowCreateProviderModal] = useState(false);
  const [showEditProviderModal, setShowEditProviderModal] = useState(false);
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithSubscription | null>(null);
  const [ridesInput, setRidesInput] = useState('10');
  const [selectedPlan, setSelectedPlan] = useState<string>('basico');
  
  // Provider locations
  const [providerLocations, setProviderLocations] = useState<ProviderLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  // New provider form state
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderWhatsapp, setNewProviderWhatsapp] = useState('');
  const [newProviderHasPatins, setNewProviderHasPatins] = useState(false);
  const [newProviderBasePrice, setNewProviderBasePrice] = useState('50');
  const [newProviderPricePerKm, setNewProviderPricePerKm] = useState('5');
  const [newProviderPatinsPrice, setNewProviderPatinsPrice] = useState('30');
  const [newProviderServices, setNewProviderServices] = useState<string[]>(['guincho_completo']);
  const [createLoading, setCreateLoading] = useState(false);
  
  // Edit provider form state
  const [editProviderName, setEditProviderName] = useState('');
  const [editProviderWhatsapp, setEditProviderWhatsapp] = useState('');
  const [editProviderHasPatins, setEditProviderHasPatins] = useState(false);
  const [editProviderBasePrice, setEditProviderBasePrice] = useState('50');
  const [editProviderPricePerKm, setEditProviderPricePerKm] = useState('5');
  const [editProviderPatinsPrice, setEditProviderPatinsPrice] = useState('30');
  const [editProviderServices, setEditProviderServices] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  const adminPassword = localStorage.getItem('admin_password') || '';

  const handleLogin = () => {
    localStorage.setItem('admin_password', password);
    setIsAuthenticated(true);
    loadProviders();
  };

  const loadProviders = async () => {
    setLoading(true);
    console.log('[AdminPanel] Loading providers...');
    try {
      const storedPassword = localStorage.getItem('admin_password');
      if (!storedPassword) {
        setIsAuthenticated(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: {
          action: 'list_providers',
          admin_password: storedPassword,
        },
      });

      // Handle edge function error (non-2xx status)
      if (error) {
        console.error('[AdminPanel] Edge function error:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('admin_password');
        toast({ title: 'Senha incorreta ou expirada. Digite novamente.', variant: 'destructive' });
        return;
      }
      
      if (data?.error) {
        if (data.error === 'Acesso não autorizado') {
          setIsAuthenticated(false);
          localStorage.removeItem('admin_password');
          toast({ title: 'Senha incorreta', variant: 'destructive' });
          return;
        }
        throw new Error(data.error);
      }

      const newProviders = data.providers || [];
      
      // Debug detalhado
      console.log('[AdminPanel] Raw provider data:', JSON.stringify(newProviders, null, 2));
      newProviders.forEach((p: any) => {
        const sub = p.provider_subscriptions?.[0];
        console.log(`[AdminPanel] Provider ${p.name}:`, {
          trial_ativo: sub?.trial_ativo,
          trial_corridas_restantes: sub?.trial_corridas_restantes,
          corridas_usadas: sub?.corridas_usadas,
          adesao_paga: sub?.adesao_paga
        });
      });
      
      setProviders(newProviders);
      
      // Atualizar selectedProvider se existir para refletir os novos dados
      if (selectedProvider) {
        const updatedProvider = newProviders.find((p: ProviderWithSubscription) => p.id === selectedProvider.id);
        if (updatedProvider) {
          console.log('[AdminPanel] Updated selectedProvider:', updatedProvider.name, updatedProvider.provider_subscriptions?.[0]?.trial_corridas_restantes);
          setSelectedProvider(updatedProvider);
        }
      }
    } catch (err: any) {
      console.error('[AdminPanel] Error loading providers:', err);
      // Clear auth on any error to allow re-login
      setIsAuthenticated(false);
      localStorage.removeItem('admin_password');
      toast({
        title: 'Erro ao carregar prestadores',
        description: 'Digite sua senha novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action: string, providerId: string, data?: any) => {
    setActionLoading(providerId);
    console.log('[AdminPanel] Executing action:', { action, providerId, data });
    try {
      const { data: result, error } = await supabase.functions.invoke('admin-providers', {
        body: {
          action,
          provider_id: providerId,
          data,
          admin_password: localStorage.getItem('admin_password'),
        },
      });

      console.log('[AdminPanel] Action result:', { result, error });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      toast({ title: 'Ação executada com sucesso!' });
      
      // Força um pequeno delay antes de recarregar para garantir que o banco atualizou
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadProviders();
      console.log('[AdminPanel] Providers reloaded after action');
    } catch (err: any) {
      console.error('[AdminPanel] Action error:', err);
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    const storedPassword = localStorage.getItem('admin_password');
    if (storedPassword) {
      setIsAuthenticated(true);
      // Load providers after a small delay to ensure state is set
      setTimeout(() => loadProviders(), 100);
    }
  }, []);

  const serviceOptions = [
    { id: 'moto', label: 'Moto' },
    { id: 'carro_popular', label: 'Carro Popular' },
    { id: 'sedan', label: 'Sedan' },
    { id: 'suv', label: 'SUVs' },
    { id: 'utilitarios_pesados', label: 'Utilitários' },
    { id: 'guincho_completo', label: 'Guincho Completo' },
  ];

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleCreateProvider = async () => {
    if (!newProviderName || !newProviderWhatsapp || newProviderServices.length === 0) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setCreateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: {
          action: 'create_provider',
          admin_password: localStorage.getItem('admin_password'),
          data: {
            name: newProviderName,
            whatsapp: newProviderWhatsapp,
            has_patins: newProviderHasPatins,
            service_types: newProviderServices,
            base_price: parseFloat(newProviderBasePrice) || 50,
            price_per_km: parseFloat(newProviderPricePerKm) || 5,
            patins_extra_price: parseFloat(newProviderPatinsPrice) || 30,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Prestador criado com sucesso!' });
      setShowCreateProviderModal(false);
      setNewProviderName('');
      setNewProviderWhatsapp('');
      setNewProviderHasPatins(false);
      setNewProviderBasePrice('50');
      setNewProviderPricePerKm('5');
      setNewProviderPatinsPrice('30');
      setNewProviderServices(['guincho_completo']);
      await loadProviders();
    } catch (err: any) {
      toast({ title: 'Erro ao criar prestador', description: err.message, variant: 'destructive' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditProvider = async () => {
    if (!selectedProvider || !editProviderName || !editProviderWhatsapp) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setEditLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: {
          action: 'update_provider',
          provider_id: selectedProvider.id,
          admin_password: localStorage.getItem('admin_password'),
          data: {
            name: editProviderName,
            whatsapp: editProviderWhatsapp,
            has_patins: editProviderHasPatins,
            service_types: editProviderServices,
            base_price: parseFloat(editProviderBasePrice) || 50,
            price_per_km: parseFloat(editProviderPricePerKm) || 5,
            patins_extra_price: parseFloat(editProviderPatinsPrice) || 30,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Prestador atualizado com sucesso!' });
      setShowEditProviderModal(false);
      await loadProviders();
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar prestador', description: err.message, variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  const loadLocations = async () => {
    setLocationsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: {
          action: 'list_locations',
          admin_password: localStorage.getItem('admin_password'),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setProviderLocations(data.locations || []);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar localizações', description: err.message, variant: 'destructive' });
    } finally {
      setLocationsLoading(false);
    }
  };

  const toggleProviderOnline = async (providerId: string, isOnline: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-providers', {
        body: {
          action: 'toggle_provider_online',
          admin_password: localStorage.getItem('admin_password'),
          data: { provider_id: providerId, is_online: isOnline },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: isOnline ? 'Prestador colocado online!' : 'Prestador colocado offline!' });
      await loadLocations();
    } catch (err: any) {
      toast({ title: 'Erro ao alterar status', description: err.message, variant: 'destructive' });
    }
  };

  // Auto-refresh locations every 10 seconds when modal is open
  useEffect(() => {
    if (!showLocationsModal || !autoRefreshEnabled) return;

    const interval = setInterval(() => {
      loadLocations();
    }, 10000);

    return () => clearInterval(interval);
  }, [showLocationsModal, autoRefreshEnabled]);

  const openEditModal = (provider: ProviderWithSubscription) => {
    setSelectedProvider(provider);
    setEditProviderName(provider.name);
    setEditProviderWhatsapp(provider.whatsapp);
    setEditProviderHasPatins(provider.has_patins || false);
    setEditProviderBasePrice(String(provider.base_price || 50));
    setEditProviderPricePerKm(String(provider.price_per_km || 5));
    setEditProviderPatinsPrice(String(provider.patins_extra_price || 30));
    setEditProviderServices(provider.service_types || []);
    setShowEditProviderModal(true);
  };

  const getSubscription = (provider: ProviderWithSubscription) => {
    return provider.provider_subscriptions?.[0] || null;
  };

  const getStatusBadge = (provider: ProviderWithSubscription) => {
    const sub = getSubscription(provider);
    if (!sub) {
      return <Badge variant="outline" className="text-gray-500">Sem plano</Badge>;
    }
    if (sub.adesao_paga) {
      const planColors = {
        basico: 'bg-blue-500',
        profissional: 'bg-green-500',
        pro: 'bg-orange-500',
      };
      return (
        <Badge className={`${planColors[sub.plano!]} text-white`}>
          {sub.plano?.toUpperCase()}
        </Badge>
      );
    }
    if (sub.trial_ativo) {
      return (
        <Badge className="bg-yellow-500 text-white">
          Trial ({sub.trial_corridas_restantes})
        </Badge>
      );
    }
    return <Badge variant="destructive">Bloqueado</Badge>;
  };

  const getRidesInfo = (provider: ProviderWithSubscription) => {
    const sub = getSubscription(provider);
    if (!sub) return '-';
    
    if (sub.trial_ativo && !sub.adesao_paga) {
      return `${sub.trial_corridas_restantes} restantes`;
    }
    
    if (sub.adesao_paga) {
      if (sub.limite_corridas === -1) {
        return `${sub.corridas_usadas} (∞)`;
      }
      return `${sub.corridas_usadas}/${sub.limite_corridas}`;
    }
    
    return '-';
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Painel Admin</CardTitle>
            <p className="text-slate-400">Digite a senha para acessar</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-slate-300">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button type="submit" className="w-full" disabled={!password}>
                <Lock className="w-4 h-4 mr-2" />
                Acessar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
              <p className="text-slate-400 text-sm">Gerenciar prestadores e planos</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="default"
              onClick={() => setShowCreateProviderModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Prestador
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setShowLocationsModal(true);
                loadLocations();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <MapPinned className="w-4 h-4 mr-2" />
              Localizações
            </Button>
            <Button
              variant="outline"
              onClick={loadProviders}
              disabled={loading}
              className="border-slate-600 text-slate-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('admin_password');
                setIsAuthenticated(false);
              }}
              className="border-slate-600 text-slate-300"
            >
              Sair
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{providers.length}</p>
                  <p className="text-xs text-slate-400">Total Prestadores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {providers.filter(p => getSubscription(p)?.trial_ativo && !getSubscription(p)?.adesao_paga).length}
                  </p>
                  <p className="text-xs text-slate-400">Em Trial</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {providers.filter(p => getSubscription(p)?.adesao_paga).length}
                  </p>
                  <p className="text-xs text-slate-400">Pagantes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {providers.reduce((acc, p) => acc + (getSubscription(p)?.corridas_usadas || 0), 0)}
                  </p>
                  <p className="text-xs text-slate-400">Total Corridas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Providers Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Prestadores ({providers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Nome</TableHead>
                      <TableHead className="text-slate-400">WhatsApp</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Trial Restante</TableHead>
                      <TableHead className="text-slate-400">Corridas Usadas</TableHead>
                      <TableHead className="text-slate-400">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((provider) => {
                      const sub = getSubscription(provider);
                      const isLoading = actionLoading === provider.id;
                      
                      return (
                        <TableRow key={provider.id} className="border-slate-700">
                          <TableCell className="text-white font-medium">
                            {provider.name}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {provider.whatsapp}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(provider)}
                          </TableCell>
                          <TableCell>
                            {sub?.trial_ativo && !sub?.adesao_paga ? (
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-lg ${(sub?.trial_corridas_restantes ?? 0) <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {sub?.trial_corridas_restantes ?? 0}
                                </span>
                                <span className="text-slate-500 text-xs">restantes</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {sub?.adesao_paga ? (
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-white">{sub?.corridas_usadas ?? 0}</span>
                                {sub?.limite_corridas !== -1 && (
                                  <span className="text-slate-500 text-xs">/ {sub?.limite_corridas}</span>
                                )}
                                {sub?.limite_corridas === -1 && (
                                  <span className="text-slate-500 text-xs">(∞)</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">{sub?.corridas_usadas ?? 0}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {/* Toggle Trial */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 border-slate-600 text-slate-300"
                                onClick={() => executeAction('toggle_trial', provider.id)}
                                disabled={isLoading}
                                title={sub?.trial_ativo ? 'Desativar Trial' : 'Ativar Trial'}
                              >
                                {isLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : sub?.trial_ativo ? (
                                  <Pause className="w-3 h-3" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                              </Button>

                              {/* Set Trial Rides */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 border-slate-600 text-slate-300"
                                onClick={() => {
                                  setSelectedProvider(provider);
                                  setRidesInput(String(sub?.trial_corridas_restantes || 10));
                                  setShowSetRidesModal(true);
                                }}
                                disabled={isLoading}
                                title="Definir Corridas"
                              >
                                <Settings className="w-3 h-3" />
                              </Button>

                              {/* Activate Plan */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 border-green-600 text-green-400"
                                onClick={() => {
                                  setSelectedProvider(provider);
                                  setSelectedPlan(sub?.plano || 'basico');
                                  setShowActivatePlanModal(true);
                                }}
                                disabled={isLoading}
                                title="Ativar Plano"
                              >
                                <Crown className="w-3 h-3" />
                              </Button>

                              {/* Reset Rides */}
                              {sub?.adesao_paga && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 border-blue-600 text-blue-400"
                                  onClick={() => executeAction('reset_rides', provider.id)}
                                  disabled={isLoading}
                                  title="Zerar Corridas"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </Button>
                              )}

                              {/* Deactivate Plan */}
                              {sub?.adesao_paga && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 border-red-600 text-red-400"
                                  onClick={() => executeAction('deactivate_plan', provider.id)}
                                  disabled={isLoading}
                                  title="Desativar Plano"
                                >
                                  <Ban className="w-3 h-3" />
                                </Button>
                              )}

                              {/* Edit Provider */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 border-purple-600 text-purple-400"
                                onClick={() => openEditModal(provider)}
                                disabled={isLoading}
                                title="Editar Prestador"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branding Manager */}
        <BrandingManager 
          providers={providers.map(p => ({
            id: p.id,
            name: p.name,
            whatsapp: p.whatsapp,
            slug: p.slug,
          }))}
          onUpdate={loadProviders}
        />
      </div>

      {/* Modal: Set Trial Rides */}
      <Dialog open={showSetRidesModal} onOpenChange={setShowSetRidesModal}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Definir Corridas de Trial</DialogTitle>
            <DialogDescription className="text-slate-400">
              Prestador: {selectedProvider?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Corridas restantes atuais</p>
              <p className="text-2xl font-bold text-emerald-400">
                {(selectedProvider && getSubscription(selectedProvider)?.trial_corridas_restantes) ?? 0}
              </p>
            </div>
            <div>
              <Label className="text-slate-300">Nova quantidade de corridas</Label>
              <Input
                type="number"
                value={ridesInput}
                onChange={(e) => setRidesInput(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white text-lg font-bold"
                min="0"
              />
            </div>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((num) => (
                <Button
                  key={num}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-600 text-slate-300"
                  onClick={() => setRidesInput(String(num))}
                >
                  {num}
                </Button>
              ))}
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={actionLoading === selectedProvider?.id}
              onClick={async () => {
                if (selectedProvider) {
                  const rides = parseInt(ridesInput);
                  console.log('[AdminPanel] Saving trial rides:', { providerId: selectedProvider.id, rides });
                  await executeAction('set_trial_rides', selectedProvider.id, { rides });
                  setShowSetRidesModal(false);
                }
              }}
            >
              {actionLoading === selectedProvider?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Corridas do Trial'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Activate Plan */}
      <Dialog open={showActivatePlanModal} onOpenChange={setShowActivatePlanModal}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Ativar Plano Manualmente</DialogTitle>
            <DialogDescription className="text-slate-400">
              Prestador: {selectedProvider?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-slate-300">Selecione o plano</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="basico">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      Básico (50 corridas - R$47/mês)
                    </div>
                  </SelectItem>
                  <SelectItem value="profissional">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-green-400" />
                      Profissional (150 corridas - R$97/mês)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedProvider) {
                  executeAction('activate_plan', selectedProvider.id, { plano: selectedPlan });
                  setShowActivatePlanModal(false);
                }
              }}
            >
              <Crown className="w-4 h-4 mr-2" />
              Ativar Plano
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Create Provider */}
      <Dialog open={showCreateProviderModal} onOpenChange={setShowCreateProviderModal}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Novo Prestador
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Cadastre um novo prestador manualmente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Nome *</Label>
                <Input
                  placeholder="Nome do prestador"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">WhatsApp *</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={newProviderWhatsapp}
                  onChange={(e) => setNewProviderWhatsapp(formatPhone(e.target.value))}
                  maxLength={15}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <Label className="text-slate-300 mb-2 block">Tabela de Preços</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-slate-400">Valor Base</Label>
                  <Input
                    type="number"
                    value={newProviderBasePrice}
                    onChange={(e) => setNewProviderBasePrice(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Por KM</Label>
                  <Input
                    type="number"
                    value={newProviderPricePerKm}
                    onChange={(e) => setNewProviderPricePerKm(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">+ Patins</Label>
                  <Input
                    type="number"
                    value={newProviderPatinsPrice}
                    onChange={(e) => setNewProviderPatinsPrice(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPatins"
                checked={newProviderHasPatins}
                onCheckedChange={(checked) => setNewProviderHasPatins(checked === true)}
                className="border-slate-600"
              />
              <Label htmlFor="hasPatins" className="text-slate-300 cursor-pointer">
                Possui patins para remoção de veículos travados
              </Label>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <Label className="text-slate-300 mb-2 block flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Tipos de Serviço *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {serviceOptions.map((service) => {
                  const isSelected = newProviderServices.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setNewProviderServices(prev =>
                          prev.includes(service.id)
                            ? prev.filter(s => s !== service.id)
                            : [...prev, service.id]
                        );
                      }}
                      className={`p-2 rounded border text-left text-sm transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {service.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={createLoading || !newProviderName || !newProviderWhatsapp || newProviderServices.length === 0}
              onClick={handleCreateProvider}
            >
              {createLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Prestador
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Provider */}
      <Dialog open={showEditProviderModal} onOpenChange={setShowEditProviderModal}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Prestador
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedProvider?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Nome *</Label>
                <Input
                  placeholder="Nome do prestador"
                  value={editProviderName}
                  onChange={(e) => setEditProviderName(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">WhatsApp *</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={editProviderWhatsapp}
                  onChange={(e) => setEditProviderWhatsapp(formatPhone(e.target.value))}
                  maxLength={15}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <Label className="text-slate-300 mb-2 block">Tabela de Preços</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-slate-400">Valor Base</Label>
                  <Input
                    type="number"
                    value={editProviderBasePrice}
                    onChange={(e) => setEditProviderBasePrice(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Por KM</Label>
                  <Input
                    type="number"
                    value={editProviderPricePerKm}
                    onChange={(e) => setEditProviderPricePerKm(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">+ Patins</Label>
                  <Input
                    type="number"
                    value={editProviderPatinsPrice}
                    onChange={(e) => setEditProviderPatinsPrice(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="editHasPatins"
                checked={editProviderHasPatins}
                onCheckedChange={(checked) => setEditProviderHasPatins(checked === true)}
                className="border-slate-600"
              />
              <Label htmlFor="editHasPatins" className="text-slate-300 cursor-pointer">
                Possui patins para remoção de veículos travados
              </Label>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <Label className="text-slate-300 mb-2 block flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Tipos de Serviço
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {serviceOptions.map((service) => {
                  const isSelected = editProviderServices.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setEditProviderServices(prev =>
                          prev.includes(service.id)
                            ? prev.filter(s => s !== service.id)
                            : [...prev, service.id]
                        );
                      }}
                      className={`p-2 rounded border text-left text-sm transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-slate-600 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {service.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={editLoading || !editProviderName || !editProviderWhatsapp}
              onClick={handleEditProvider}
            >
              {editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Provider Locations */}
      <Dialog open={showLocationsModal} onOpenChange={setShowLocationsModal}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MapPinned className="w-5 h-5" />
              Localizações dos Prestadores em Tempo Real
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {providerLocations.filter(l => l.is_online).length} prestador(es) online
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadLocations}
                  disabled={locationsLoading}
                  className="border-slate-600 text-slate-300"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${locationsLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    autoRefreshEnabled 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-slate-800 text-slate-400 border border-slate-600'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                  Auto-refresh {autoRefreshEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-slate-400">Online ({providerLocations.filter(l => l.is_online).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-slate-500 rounded-full" />
                  <span className="text-slate-400">Offline ({providerLocations.filter(l => !l.is_online).length})</span>
                </div>
              </div>
            </div>

            {locationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : providerLocations.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Navigation className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum prestador com rastreamento ativo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Map */}
                <AdminProvidersMap 
                  locations={providerLocations} 
                  className="h-[350px] rounded-lg border border-slate-700"
                  onToggleOnline={toggleProviderOnline}
                />
                
                {/* Provider List */}
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {providerLocations.map((loc) => (
                    <div
                      key={loc.id}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        loc.is_online 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          loc.is_online ? 'bg-green-500/20' : 'bg-slate-700'
                        }`}>
                          <Truck className={`w-4 h-4 ${loc.is_online ? 'text-green-400' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-white text-sm flex items-center gap-2">
                            {loc.provider_name}
                            {loc.is_online && (
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                          </h4>
                          <p className="text-xs text-slate-400">{loc.provider_whatsapp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className={`text-xs ${loc.is_online ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' : 'border-green-500/50 text-green-400 hover:bg-green-500/10'}`}
                          onClick={() => toggleProviderOnline(loc.provider_id, !loc.is_online)}
                        >
                          {loc.is_online ? 'Desativar' : 'Ativar'}
                        </Button>
                        <div className="text-right">
                          <Badge className={`text-xs ${loc.is_online ? 'bg-green-600' : 'bg-slate-600'}`}>
                            {loc.is_online ? 'Online' : 'Offline'}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            {loc.last_seen_at ? new Date(loc.last_seen_at).toLocaleTimeString('pt-BR') : 'Sem registro'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
