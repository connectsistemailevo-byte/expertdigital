import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useLocation } from '@/contexts/LocationContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, RefreshCw, CheckCircle2, UserPlus, DollarSign, Search, Edit, ArrowLeft, Zap, Gift, AlertTriangle, ExternalLink, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MiniMap from '@/components/MiniMap';
import { PlanSelectionModal } from '@/components/PlanSelectionModal';

interface ProviderRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProviderData {
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
}

interface SubscriptionData {
  trial_ativo: boolean;
  trial_corridas_restantes: number;
  corridas_usadas: number;
  plano: string | null;
  adesao_paga: boolean;
  limite_corridas: number | null;
}

const serviceOptions = [
  { id: 'moto', label: 'Somente Moto' },
  { id: 'carro_popular', label: 'Carro Popular' },
  { id: 'sedan', label: 'Sedan' },
  { id: 'suv', label: 'SUVs' },
  { id: 'utilitarios_pesados', label: 'Utilitários Pesados' },
  { id: 'guincho_completo', label: 'Guincho Completo' },
];

// Função para gerar slug a partir do nome
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
};

type ModalMode = 'search' | 'register' | 'edit';

const ProviderRegistrationModal: React.FC<ProviderRegistrationModalProps> = ({ open, onOpenChange }) => {
  const { location, refreshLocation } = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<ModalMode>('search');
  const [searchPhone, setSearchPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [existingProvider, setExistingProvider] = useState<ProviderData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [hasPatins, setHasPatins] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState('50');
  const [pricePerKm, setPricePerKm] = useState('5');
  const [patinsExtraPrice, setPatinsExtraPrice] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setMode('search');
      setSearchPhone('');
      setExistingProvider(null);
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setName('');
    setWhatsapp('');
    setHasPatins(false);
    setSelectedServices([]);
    setBasePrice('50');
    setPricePerKm('5');
    setPatinsExtraPrice('30');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, isSearch = false) => {
    const formatted = formatPhone(e.target.value);
    if (isSearch) {
      setSearchPhone(formatted);
    } else {
      setWhatsapp(formatted);
    }
  };

  const handleSearch = async () => {
    const cleanPhone = searchPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Digite um número de WhatsApp válido');
      return;
    }

    setIsSearching(true);
    try {
      // O número pode estar salvo como (62) 99142-9264 ou 62991429264
      // Usar os últimos 4 dígitos com hífen para match mais preciso
      const last4 = cleanPhone.slice(-4);
      const secondToLast4 = cleanPhone.slice(-8, -4);
      
      // Criar padrão que funciona: busca por "XXXX-YYYY" onde YYYY são os últimos 4 dígitos
      const searchPattern = `%${secondToLast4}%${last4}%`;
      
      console.log('Buscando prestador:', { 
        cleanPhone, 
        searchPattern,
        formattedForSearch: searchPhone,
        last4,
        secondToLast4
      });
      
      const { data: providers, error } = await supabase
        .from('providers')
        .select('*')
        .ilike('whatsapp', searchPattern)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('Resultado da busca:', { providers, error });

      if (error) {
        console.error('Erro na busca:', error);
        throw error;
      }

      if (providers && providers.length > 0) {
        const providerData = providers[0] as ProviderData;
        console.log('Provider encontrado:', providerData);
        
        // Setar o provider existente
        setExistingProvider(providerData);
        
        // Preencher formulário com dados do banco
        setName(providerData.name);
        setWhatsapp(providerData.whatsapp);
        setHasPatins(providerData.has_patins);
        setSelectedServices(providerData.service_types || []);
        setBasePrice(String(providerData.base_price || 50));
        setPricePerKm(String(providerData.price_per_km || 5));
        setPatinsExtraPrice(String(providerData.patins_extra_price || 30));
        
        // Buscar subscription do provider
        console.log('Buscando subscription para provider_id:', providerData.id);
        const { data: subData, error: subError } = await supabase
          .from('provider_subscriptions')
          .select('*')
          .eq('provider_id', providerData.id)
          .limit(1);
        
        console.log('Subscription result:', { subData, subError });
        
        if (subData && subData.length > 0) {
          const subscriptionData = subData[0] as SubscriptionData;
          console.log('Subscription encontrada:', subscriptionData);
          setSubscription(subscriptionData);
        } else {
          console.log('Nenhuma subscription encontrada');
          setSubscription(null);
        }
        
        // Mudar para modo de edição
        setMode('edit');
        toast.success(`Bem-vindo de volta, ${providerData.name}!`, {
          description: `Seus dados foram carregados do cadastro.`
        });
      } else {
        // Nenhum prestador encontrado, ir para cadastro
        console.log('Nenhum prestador encontrado');
        setWhatsapp(searchPhone);
        setSubscription(null);
        setExistingProvider(null);
        setMode('register');
        toast.info('Nenhum cadastro encontrado. Faça seu cadastro agora!');
      }
    } catch (error: any) {
      console.error('Erro ao buscar prestador:', error);
      toast.error('Erro ao buscar cadastro', {
        description: error.message || 'Tente novamente'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const canSubmit = name.length >= 2 && whatsapp.length >= 14 && selectedServices.length > 0 && !location.loading && !location.error;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'edit' && existingProvider) {
        // Update existing provider
        const { error } = await supabase
          .from('providers')
          .update({
            name,
            whatsapp,
            has_patins: hasPatins,
            service_types: selectedServices,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            region: location.region,
            base_price: parseFloat(basePrice) || 50,
            price_per_km: parseFloat(pricePerKm) || 5,
            patins_extra_price: parseFloat(patinsExtraPrice) || 30,
          })
          .eq('id', existingProvider.id);

        if (error) throw error;

        toast.success('Cadastro atualizado com sucesso!');
      } else {
        // Verificar se já existe um prestador com este WhatsApp antes de criar
        const cleanPhone = whatsapp.replace(/\D/g, '');
        const { data: existingCheck } = await supabase
          .from('providers')
          .select('id, name')
          .or(`whatsapp.eq.${whatsapp},whatsapp.eq.${cleanPhone},whatsapp.ilike.%${cleanPhone.slice(-8)}%`)
          .limit(1);

        if (existingCheck && existingCheck.length > 0) {
          toast.error('Este número de WhatsApp já está cadastrado!', {
            description: `Prestador: ${existingCheck[0].name}. Use a busca para acessar seu cadastro.`,
          });
          setIsLoading(false);
          return;
        }

        // Gerar slug único
        const baseSlug = generateSlug(name);
        let slug = baseSlug;
        let slugCounter = 1;
        
        // Verificar se slug já existe e gerar um único
        while (true) {
          const { data: existingSlug } = await supabase
            .from('providers')
            .select('id')
            .eq('slug', slug)
            .single();
          
          if (!existingSlug) break;
          slug = `${baseSlug}-${slugCounter}`;
          slugCounter++;
        }

        // Create new provider
        const { data: newProvider, error } = await supabase.from('providers').insert({
          name,
          whatsapp,
          slug, // Adicionar slug gerado
          has_patins: hasPatins,
          service_types: selectedServices,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          region: location.region,
          base_price: parseFloat(basePrice) || 50,
          price_per_km: parseFloat(pricePerKm) || 5,
          patins_extra_price: parseFloat(patinsExtraPrice) || 30,
        }).select().single();

        if (error) {
          // Verificar se é erro de duplicidade
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            toast.error('Este número de WhatsApp já está cadastrado!', {
              description: 'Use a busca para acessar seu cadastro existente.',
            });
            setIsLoading(false);
            return;
          }
          throw error;
        }

        // Criar subscription com trial automaticamente
        if (newProvider) {
          const { error: subError } = await supabase.from('provider_subscriptions').insert({
            provider_id: newProvider.id,
            trial_ativo: true,
            trial_corridas_restantes: 10,
            corridas_usadas: 0,
            adesao_paga: false,
            limite_corridas: 0,
            mensalidade_atual: 0,
          });

          if (subError) {
            console.error('Error creating subscription:', subError);
          }

          // Criar customização padrão para o prestador
          const { error: customError } = await supabase.from('provider_customization').insert({
            provider_id: newProvider.id,
            company_name: name,
          });

          if (customError) {
            console.error('Error creating customization:', customError);
          }
        }

        toast.success('Cadastro realizado com sucesso!', {
          description: 'Você ganhou 10 corridas GRÁTIS para testar o sistema!',
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving provider:', error);
      toast.error('Erro ao salvar', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSearchMode = () => (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />
        </div>
        <h3 className="font-display font-bold text-base sm:text-lg">Área do Prestador</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Digite seu WhatsApp para acessar ou criar seu cadastro
        </p>
      </div>

      {/* Trial Banner */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="font-semibold text-sm text-green-400">Teste Grátis!</p>
            <p className="text-xs text-muted-foreground">
              Novos prestadores ganham <span className="text-green-400 font-bold">10 corridas GRÁTIS</span> para testar
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Seu WhatsApp</label>
          <Input
            placeholder="(00) 00000-0000"
            value={searchPhone}
            onChange={(e) => handlePhoneChange(e, true)}
            maxLength={15}
            className="h-10 sm:h-12 text-center text-base sm:text-lg"
          />
        </div>

        <Button
          variant="hero"
          size="lg"
          className="w-full h-10 sm:h-12 text-sm sm:text-base"
          disabled={searchPhone.length < 14 || isSearching}
          onClick={handleSearch}
        >
          {isSearching ? (
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          )}
          {isSearching ? 'Buscando...' : 'Buscar Meu Cadastro'}
        </Button>
      </div>

      <div className="text-center">
        <button
          onClick={() => {
            setWhatsapp(searchPhone);
            setMode('register');
          }}
          className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Não tenho cadastro → <span className="text-secondary font-medium">Cadastrar agora</span>
        </button>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* Back button */}
      <button
        onClick={() => setMode('search')}
        className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
        Voltar
      </button>

      {/* Trial/Subscription Banner - Sempre mostra no modo edit */}
      {mode === 'edit' && (() => {
        const trialEsgotado = subscription?.trial_ativo && (subscription?.trial_corridas_restantes ?? 0) <= 0;
        const semPlano = !subscription?.trial_ativo && !subscription?.adesao_paga;
        const precisaPlano = trialEsgotado || semPlano;

        return (
          <div className={`rounded-xl p-3 border ${
            precisaPlano
              ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-500/40'
              : subscription?.trial_ativo 
                ? (subscription?.trial_corridas_restantes ?? 0) <= 3 
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/40'
                  : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/40'
                : subscription?.adesao_paga
                  ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/40'
                  : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-500/40'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                precisaPlano
                  ? 'bg-red-500/30'
                  : subscription?.trial_ativo 
                    ? (subscription?.trial_corridas_restantes ?? 0) <= 3 ? 'bg-amber-500/30' : 'bg-green-500/30'
                    : subscription?.adesao_paga ? 'bg-blue-500/30' : 'bg-red-500/30'
              }`}>
                {precisaPlano ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : subscription?.trial_ativo ? (
                  (subscription?.trial_corridas_restantes ?? 0) <= 3 ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Gift className="w-5 h-5 text-green-400" />
                  )
                ) : subscription?.adesao_paga ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="flex-1">
                {precisaPlano ? (
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="font-bold text-sm text-red-400">
                        ⚠️ {trialEsgotado ? 'Trial Esgotado!' : 'Sem Plano Ativo'}
                      </p>
                      <p className="text-sm text-foreground">
                        {trialEsgotado ? 'Suas 10 corridas gratuitas acabaram' : 'Você precisa de um plano para continuar'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold"
                      onClick={() => setShowPlanModal(true)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Contratar Plano Agora
                    </Button>
                  </div>
                ) : subscription?.trial_ativo ? (
                  <>
                    <p className={`font-bold text-sm ${(subscription?.trial_corridas_restantes ?? 0) <= 3 ? 'text-amber-400' : 'text-green-400'}`}>
                      🎁 Período de Teste Ativo
                    </p>
                    <p className="text-sm text-foreground font-semibold">
                      Você tem <span className={`font-black text-xl ${(subscription?.trial_corridas_restantes ?? 0) <= 3 ? 'text-amber-400' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`}>
                        {subscription?.trial_corridas_restantes ?? 0}
                      </span> solicitações restantes no trial
                    </p>
                  </>
                ) : subscription?.adesao_paga ? (
                  <>
                    <p className="font-bold text-sm text-blue-400">
                      ✓ Plano {subscription?.plano?.charAt(0).toUpperCase()}{subscription?.plano?.slice(1)}
                    </p>
                    <p className="text-sm text-foreground font-medium">
                      {subscription?.plano === 'pro' ? (
                        <span className="text-blue-400 font-bold">Solicitações ilimitadas</span>
                      ) : (
                        <>Usadas: <span className="font-bold text-lg">{subscription?.corridas_usadas ?? 0}</span> / {subscription?.limite_corridas ?? 0}</>
                      )}
                    </p>
                  </>
                ) : subscription ? (
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div>
                      <p className="font-bold text-sm text-red-400">⚠️ Trial Expirado</p>
                      <p className="text-sm text-foreground">Suas corridas acabaram</p>
                    </div>
                    <Button
                      size="sm"
                      className="flex-shrink-0 text-xs bg-gradient-to-r from-primary to-purple-600 text-white"
                      onClick={() => setShowPlanModal(true)}
                    >
                      <CreditCard className="w-3 h-3 mr-1" />
                      Ver Planos
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="font-bold text-sm text-amber-400">⏳ Carregando informações...</p>
                    <p className="text-sm text-foreground">Aguarde enquanto buscamos seus dados</p>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Location Map */}
      <div className="rounded-xl overflow-hidden border border-border">
        <MiniMap className="h-[100px] w-full" />
        
        <div className="p-2 bg-muted">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <MapPin className="w-3 h-3 text-secondary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground">Sua localização</p>
              <p className="text-[11px] font-medium truncate">
                {location.loading ? 'Buscando...' : location.error || location.address}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={refreshLocation}
              className="shrink-0 h-7 w-7"
              disabled={location.loading}
            >
              <RefreshCw className={`w-3 h-3 ${location.loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="block text-sm font-semibold mb-1.5 text-foreground">Nome *</label>
          <Input
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 text-base font-medium w-full"
          />
        </div>
        <div className="min-w-0">
          <label className="block text-sm font-semibold mb-1.5 text-foreground">WhatsApp *</label>
          <Input
            placeholder="(00) 00000-0000"
            value={whatsapp}
            onChange={(e) => handlePhoneChange(e)}
            maxLength={15}
            className="h-10 text-base font-medium w-full"
          />
        </div>
      </div>

      {/* Pricing Section - Enhanced visibility */}
      <div className="p-2 sm:p-4 rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
          </div>
          <span className="text-xs sm:text-base font-bold text-foreground">Tabela de Preços</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          <div className="min-w-0">
            <label className="block text-[9px] sm:text-xs font-semibold text-foreground mb-0.5 sm:mb-1 truncate">Valor Base</label>
            <div className="relative">
              <span className="absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-sm font-bold text-green-400">R$</span>
              <Input
                type="number"
                placeholder="50"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="h-8 sm:h-10 text-xs sm:text-base font-bold pl-6 sm:pl-10 w-full"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-[9px] sm:text-xs font-semibold text-foreground mb-0.5 sm:mb-1 truncate">Por KM</label>
            <div className="relative">
              <span className="absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-sm font-bold text-green-400">R$</span>
              <Input
                type="number"
                placeholder="5"
                value={pricePerKm}
                onChange={(e) => setPricePerKm(e.target.value)}
                className="h-8 sm:h-10 text-xs sm:text-base font-bold pl-6 sm:pl-10 w-full"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-[9px] sm:text-xs font-semibold text-foreground mb-0.5 sm:mb-1 truncate">+ Patins</label>
            <div className="relative">
              <span className="absolute left-1.5 sm:left-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-sm font-bold text-green-400">R$</span>
              <Input
                type="number"
                placeholder="30"
                value={patinsExtraPrice}
                onChange={(e) => setPatinsExtraPrice(e.target.value)}
                className="h-8 sm:h-10 text-xs sm:text-base font-bold pl-6 sm:pl-10 w-full"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Has Patins */}
      <div className="flex items-start space-x-3 p-3 rounded-xl border-2 border-border bg-muted/50">
        <Checkbox
          id="hasPatins"
          checked={hasPatins}
          onCheckedChange={(checked) => setHasPatins(checked === true)}
          className="w-5 h-5 flex-shrink-0 mt-0.5"
        />
        <label
          htmlFor="hasPatins"
          className="text-xs sm:text-sm font-semibold cursor-pointer text-foreground leading-tight"
        >
          Possui patins para remoção de veículos travados
        </label>
      </div>

      {/* Service Types - Enhanced visibility */}
      <div className="p-2 sm:p-4 rounded-xl border-2 border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
            <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
          </div>
          <span className="text-xs sm:text-base font-bold text-foreground">Tipos de Serviço *</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {serviceOptions.map((service) => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                className={`relative flex items-center justify-between gap-1 p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-secondary bg-secondary/20 shadow-lg shadow-secondary/20'
                    : 'border-border hover:border-secondary/50 hover:bg-muted'
                }`}
              >
                <span className={`font-semibold text-[11px] sm:text-sm leading-tight ${isSelected ? 'text-secondary' : 'text-foreground'}`}>
                  {service.label}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-secondary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        variant="hero"
        size="default"
        className="w-full h-9"
        disabled={!canSubmit || isLoading}
        onClick={handleSubmit}
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : mode === 'edit' ? (
          <Edit className="w-4 h-4 mr-2" />
        ) : (
          <UserPlus className="w-4 h-4 mr-2" />
        )}
        {isLoading ? 'Salvando...' : mode === 'edit' ? 'Atualizar Cadastro' : 'Cadastrar'}
      </Button>
    </div>
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-16px)] sm:w-[95vw] max-w-[500px] max-h-[85vh] overflow-y-auto overflow-x-hidden bg-card border-border p-0 animate-scale-in mx-auto rounded-xl">
        {/* Header */}
        <div className="bg-primary p-3 text-primary-foreground sticky top-0 z-10">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-display font-bold text-center flex items-center justify-center gap-2">
              <Truck className="w-4 h-4" />
              {mode === 'search' ? 'Área do Prestador' : mode === 'edit' ? 'Editar Cadastro' : 'Novo Cadastro'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-center text-[10px] sm:text-[11px]">
              {mode === 'search' 
                ? 'Acesse ou crie seu cadastro' 
                : mode === 'edit' 
                  ? 'Atualize suas informações'
                  : 'Preencha seus dados para se cadastrar'
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        {mode === 'search' ? renderSearchMode() : renderForm()}
      </DialogContent>
    </Dialog>

    {/* Modal de seleção de planos */}
    {existingProvider && (
      <PlanSelectionModal
        open={showPlanModal}
        onOpenChange={setShowPlanModal}
        providerId={existingProvider.id}
        whatsapp={existingProvider.whatsapp}
      />
    )}
  </>
  );
};

export default ProviderRegistrationModal;