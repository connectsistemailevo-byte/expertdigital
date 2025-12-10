import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { PlanSelectionModal } from '@/components/PlanSelectionModal';
import { TrialExhaustedModal } from '@/components/TrialExhaustedModal';
import { 
  Truck, 
  Phone, 
  MapPin, 
  CreditCard, 
  TrendingUp, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Palette,
  Settings
} from 'lucide-react';

interface ProviderData {
  id: string;
  name: string;
  whatsapp: string;
  address: string | null;
  region: string | null;
  service_types: string[];
  has_patins: boolean;
  latitude: number;
  longitude: number;
  base_price: number;
  price_per_km: number;
}

interface SubscriptionData {
  plano: 'basico' | 'profissional' | 'pro' | null;
  adesao_paga: boolean;
  trial_ativo: boolean;
  trial_corridas_restantes: number;
  corridas_usadas: number;
  limite_corridas: number;
  mensalidade_atual: number;
  proxima_cobranca: string | null;
}

interface CustomizationData {
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  company_name: string | null;
  custom_domain: string | null;
}

export default function ProviderDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [whatsapp, setWhatsapp] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [customization, setCustomization] = useState<CustomizationData | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showTrialExhaustedModal, setShowTrialExhaustedModal] = useState(false);
  const [blockReason, setBlockReason] = useState<'trial_exhausted' | 'limit_reached' | 'no_plan'>('trial_exhausted');

  const success = searchParams.get('success');
  const providerId = searchParams.get('provider_id');

  // Verificar pagamento após retorno do Stripe
  const verifyPayment = useCallback(async (id: string, phone: string) => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-provider-payment', {
        body: { provider_id: id, whatsapp: phone },
      });

      if (error) throw error;

      if (data?.adesao_paga) {
        toast({
          title: 'Pagamento confirmado!',
          description: `Seu plano ${data.plano?.toUpperCase()} foi ativado com sucesso.`,
        });
        // Recarregar dados
        await loadProviderData(phone);
      }
    } catch (err) {
      console.error('Verify payment error:', err);
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Carregar dados do prestador
  const loadProviderData = async (phone: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-provider-subscription', {
        body: { whatsapp: phone },
      });

      console.log('[ProviderDashboard] Dados carregados:', data);
      console.log('[ProviderDashboard] needs_plan_selection:', data?.needs_plan_selection);
      console.log('[ProviderDashboard] subscription:', data?.subscription);

      if (error) throw error;

      if (!data?.found) {
        toast({
          title: 'Prestador não encontrado',
          description: 'Verifique o número de WhatsApp.',
          variant: 'destructive',
        });
        return;
      }

      setProvider(data.provider);
      setSubscription(data.subscription);
      setCustomization(data.customization);

      // Verificar se precisa mostrar modal de planos
      const sub = data.subscription;
      const trialEsgotado = !sub?.adesao_paga && sub?.trial_corridas_restantes <= 0;
      const limiteAtingido = sub?.adesao_paga && sub?.plano !== 'pro' && sub?.limite_corridas > 0 && sub?.corridas_usadas >= sub?.limite_corridas;
      
      console.log('[ProviderDashboard] trialEsgotado:', trialEsgotado);
      console.log('[ProviderDashboard] limiteAtingido:', limiteAtingido);

      // Mostrar modal de trial esgotado se necessário
      if (trialEsgotado || limiteAtingido || data.needs_plan_selection) {
        if (trialEsgotado) {
          setBlockReason('trial_exhausted');
        } else if (limiteAtingido) {
          setBlockReason('limit_reached');
        } else {
          setBlockReason('no_plan');
        }
        console.log('[ProviderDashboard] Abrindo modal de planos, razão:', trialEsgotado ? 'trial_exhausted' : limiteAtingido ? 'limit_reached' : 'no_plan');
        setShowTrialExhaustedModal(true);
      }

      // Salvar whatsapp no localStorage
      localStorage.setItem('provider_whatsapp', phone);
    } catch (err: any) {
      console.error('Load provider error:', err);
      toast({
        title: 'Erro ao carregar dados',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Efeito para verificar pagamento após retorno do Stripe
  useEffect(() => {
    if (success === 'true' && providerId) {
      const savedWhatsapp = localStorage.getItem('provider_whatsapp');
      if (savedWhatsapp) {
        verifyPayment(providerId, savedWhatsapp);
      }
    }
  }, [success, providerId, verifyPayment]);

  // Efeito para carregar dados do prestador se já logado
  useEffect(() => {
    const savedWhatsapp = localStorage.getItem('provider_whatsapp');
    console.log('[ProviderDashboard] savedWhatsapp:', savedWhatsapp);
    if (savedWhatsapp) {
      setWhatsapp(savedWhatsapp);
      loadProviderData(savedWhatsapp);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (whatsapp.length >= 10) {
      loadProviderData(whatsapp);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('provider_whatsapp');
    setProvider(null);
    setSubscription(null);
    setCustomization(null);
    setWhatsapp('');
  };

  const getPlanBadge = () => {
    if (!subscription) return null;

    // Trial esgotado
    if (!subscription.adesao_paga && subscription.trial_corridas_restantes <= 0) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500">
          Trial Esgotado - Contrate um Plano
        </Badge>
      );
    }

    if (subscription.trial_ativo && !subscription.adesao_paga) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">
          Trial - {subscription.trial_corridas_restantes} corridas
        </Badge>
      );
    }

    const planColors = {
      basico: 'bg-blue-500/20 text-blue-400 border-blue-500',
      profissional: 'bg-green-500/20 text-green-400 border-green-500',
      pro: 'bg-orange-500/20 text-orange-400 border-orange-500',
    };

    return (
      <Badge className={planColors[subscription.plano!] || ''}>
        Plano {subscription.plano?.toUpperCase()}
      </Badge>
    );
  };

  // Tela de login
  if (!provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Área do Prestador</CardTitle>
            <p className="text-slate-400">Digite seu WhatsApp para acessar</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="whatsapp" className="text-slate-300">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="11999999999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                  className="bg-slate-700 border-slate-600 text-white"
                  maxLength={11}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSearching || whatsapp.length < 10}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Acessar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      {isVerifying && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-white">Verificando pagamento...</p>
            </div>
          </Card>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Olá, {customization?.company_name || provider.name}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getPlanBadge()}
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="border-slate-600 text-slate-300">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Alerta de Trial Esgotado */}
        {subscription && !subscription.adesao_paga && subscription.trial_corridas_restantes <= 0 && (
          <Card className="bg-red-500/20 border-red-500/50">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-400">Período de Teste Encerrado</h3>
                    <p className="text-slate-400">Suas 10 corridas gratuitas acabaram. Contrate um plano para continuar.</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowTrialExhaustedModal(true)}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Contratar Plano
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerta de Limite Atingido (planos pagos) */}
        {subscription && subscription.adesao_paga && subscription.plano !== 'pro' && 
         subscription.limite_corridas > 0 && subscription.corridas_usadas >= subscription.limite_corridas && (
          <Card className="bg-yellow-500/20 border-yellow-500/50">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-400">Limite de Corridas Atingido</h3>
                    <p className="text-slate-400">Você atingiu o limite de {subscription.limite_corridas} corridas do seu plano.</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowPlanModal(true)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Fazer Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Corridas */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Corridas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {subscription?.corridas_usadas || 0}
                {subscription?.limite_corridas && subscription.limite_corridas > 0 && (
                  <span className="text-lg text-slate-500">
                    /{subscription.limite_corridas}
                  </span>
                )}
                {subscription?.limite_corridas === -1 && (
                  <span className="text-sm text-green-400 ml-2">∞</span>
                )}
              </div>
              {subscription?.limite_corridas && subscription.limite_corridas > 0 && (
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-500"
                    style={{
                      width: `${Math.min(
                        ((subscription.corridas_usadas || 0) / subscription.limite_corridas) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plano */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription?.adesao_paga ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-xl font-bold text-white capitalize">
                    {subscription.plano}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-400">Trial Ativo</span>
                </div>
              )}
              {subscription?.proxima_cobranca && (
                <p className="text-xs text-slate-500 mt-1">
                  Próxima cobrança: {new Date(subscription.proxima_cobranca).toLocaleDateString('pt-BR')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mensalidade */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Mensalidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                R$ {(subscription?.mensalidade_atual || 0).toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">por mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Prestador */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Nome</Label>
                <p className="text-white">{provider.name}</p>
              </div>
              <div>
                <Label className="text-slate-400">WhatsApp</Label>
                <p className="text-white">{provider.whatsapp}</p>
              </div>
              <div>
                <Label className="text-slate-400">Endereço</Label>
                <p className="text-white">{provider.address || 'Não informado'}</p>
              </div>
              <div>
                <Label className="text-slate-400">Região</Label>
                <p className="text-white">{provider.region || 'Não informada'}</p>
              </div>
              <div>
                <Label className="text-slate-400">Serviços</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {provider.service_types.map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-slate-400">Patins</Label>
                <p className="text-white">{provider.has_patins ? 'Sim' : 'Não'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personalização (apenas para planos profissional e pro) */}
        {subscription?.adesao_paga && (subscription.plano === 'profissional' || subscription.plano === 'pro') && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Personalização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Nome da Empresa</Label>
                  <p className="text-white">{customization?.company_name || 'Não configurado'}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Domínio Próprio</Label>
                  <p className="text-white">{customization?.custom_domain || 'Não configurado'}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-slate-600"
                      style={{ backgroundColor: customization?.primary_color || '#6366f1' }}
                    />
                    <span className="text-white">{customization?.primary_color || '#6366f1'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400">Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-slate-600"
                      style={{ backgroundColor: customization?.secondary_color || '#8b5cf6' }}
                    />
                    <span className="text-white">{customization?.secondary_color || '#8b5cf6'}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="border-slate-600 text-slate-300">
                Editar Personalização
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-4">
          {!subscription?.adesao_paga && (
            <Button
              onClick={() => setShowPlanModal(true)}
              className="bg-gradient-to-r from-primary to-purple-600"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Escolher Plano
            </Button>
          )}
          {subscription?.adesao_paga && subscription.plano !== 'pro' && (
            <Button
              onClick={() => setShowPlanModal(true)}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              Fazer Upgrade
            </Button>
          )}
        </div>
      </div>

      {/* Modal de Trial Esgotado */}
      <TrialExhaustedModal
        open={showTrialExhaustedModal}
        onOpenChange={setShowTrialExhaustedModal}
        providerId={provider.id}
        whatsapp={provider.whatsapp}
        reason={blockReason}
        message={blockReason === 'limit_reached' 
          ? `Você atingiu o limite de ${subscription?.limite_corridas} corridas do seu plano.` 
          : undefined}
      />

      {/* Modal de Seleção de Plano */}
      <PlanSelectionModal
        open={showPlanModal}
        onOpenChange={setShowPlanModal}
        providerId={provider.id}
        whatsapp={provider.whatsapp}
        trialCorridasRestantes={subscription?.trial_corridas_restantes}
        showTrial={subscription?.trial_ativo && !subscription?.adesao_paga}
      />
    </div>
  );
}
