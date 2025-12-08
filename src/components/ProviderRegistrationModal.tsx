import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocation } from '@/contexts/LocationContext';
import { MapPin, Truck, RefreshCw, CheckCircle2, UserPlus, DollarSign, Search, Edit, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MiniMap from '@/components/MiniMap';

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

const serviceOptions = [
  { id: 'moto', label: 'Somente Moto' },
  { id: 'carro_popular', label: 'Carro Popular' },
  { id: 'sedan', label: 'Sedan' },
  { id: 'suv', label: 'SUVs' },
  { id: 'utilitarios_pesados', label: 'Utilitários Pesados' },
  { id: 'guincho_completo', label: 'Guincho Completo' },
];

type ModalMode = 'search' | 'register' | 'edit';

const ProviderRegistrationModal: React.FC<ProviderRegistrationModalProps> = ({ open, onOpenChange }) => {
  const { location, refreshLocation } = useLocation();
  const [mode, setMode] = useState<ModalMode>('search');
  const [searchPhone, setSearchPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [existingProvider, setExistingProvider] = useState<ProviderData | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [hasPatins, setHasPatins] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState('50');
  const [pricePerKm, setPricePerKm] = useState('5');
  const [patinsExtraPrice, setPatinsExtraPrice] = useState('30');
  const [isLoading, setIsLoading] = useState(false);

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
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .or(`whatsapp.eq.${searchPhone},whatsapp.eq.${cleanPhone},whatsapp.eq.55${cleanPhone}`)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingProvider(data as ProviderData);
        // Populate form with existing data
        setName(data.name);
        setWhatsapp(data.whatsapp);
        setHasPatins(data.has_patins);
        setSelectedServices(data.service_types || []);
        setBasePrice(String(data.base_price || 50));
        setPricePerKm(String(data.price_per_km || 5));
        setPatinsExtraPrice(String(data.patins_extra_price || 30));
        setMode('edit');
        toast.success('Cadastro encontrado!');
      } else {
        // No provider found, go to registration
        setWhatsapp(searchPhone);
        setMode('register');
        toast.info('Nenhum cadastro encontrado. Faça seu cadastro agora!');
      }
    } catch (error: any) {
      console.error('Error searching provider:', error);
      toast.error('Erro ao buscar cadastro');
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
        // Create new provider
        const { error } = await supabase.from('providers').insert({
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
        });

        if (error) throw error;

        toast.success('Cadastro realizado com sucesso!', {
          description: 'Você já está disponível para receber solicitações na sua região.',
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
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-secondary" />
        </div>
        <h3 className="font-display font-bold text-lg">Área do Prestador</h3>
        <p className="text-sm text-muted-foreground">
          Digite seu WhatsApp para acessar ou criar seu cadastro
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Seu WhatsApp</label>
          <Input
            placeholder="(00) 00000-0000"
            value={searchPhone}
            onChange={(e) => handlePhoneChange(e, true)}
            maxLength={15}
            className="h-12 text-center text-lg"
          />
        </div>

        <Button
          variant="hero"
          size="lg"
          className="w-full"
          disabled={searchPhone.length < 14 || isSearching}
          onClick={handleSearch}
        >
          {isSearching ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Search className="w-5 h-5 mr-2" />
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
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Não tenho cadastro → <span className="text-secondary font-medium">Cadastrar agora</span>
        </button>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="p-4 space-y-4">
      {/* Back button */}
      <button
        onClick={() => setMode('search')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

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
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium mb-1">Nome *</label>
          <Input
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1">WhatsApp *</label>
          <Input
            placeholder="(00) 00000-0000"
            value={whatsapp}
            onChange={(e) => handlePhoneChange(e)}
            maxLength={15}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Pricing Section */}
      <div className="p-2 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center gap-1 mb-2">
          <DollarSign className="w-3 h-3 text-green-500" />
          <span className="text-[11px] font-medium">Tabela de Preços</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[9px] text-muted-foreground mb-0.5">Base (R$)</label>
            <Input
              type="number"
              placeholder="50"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="h-7 text-xs"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-[9px] text-muted-foreground mb-0.5">Por KM (R$)</label>
            <Input
              type="number"
              placeholder="5"
              value={pricePerKm}
              onChange={(e) => setPricePerKm(e.target.value)}
              className="h-7 text-xs"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-[9px] text-muted-foreground mb-0.5">Patins (R$)</label>
            <Input
              type="number"
              placeholder="30"
              value={patinsExtraPrice}
              onChange={(e) => setPatinsExtraPrice(e.target.value)}
              className="h-7 text-xs"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Has Patins */}
      <div className="flex items-center space-x-2 p-2 rounded-lg border border-border bg-muted/50">
        <Checkbox
          id="hasPatins"
          checked={hasPatins}
          onCheckedChange={(checked) => setHasPatins(checked === true)}
        />
        <label
          htmlFor="hasPatins"
          className="text-[11px] font-medium cursor-pointer"
        >
          Possui patins para remoção de veículos travados
        </label>
      </div>

      {/* Service Types */}
      <div>
        <label className="block text-[11px] font-medium mb-1.5">Tipos de serviço *</label>
        <div className="grid grid-cols-3 gap-1">
          {serviceOptions.map((service) => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                className={`relative flex items-center justify-center gap-0.5 p-1.5 rounded-md border-2 transition-all duration-200 text-center ${
                  isSelected
                    ? 'border-secondary bg-secondary/10'
                    : 'border-border hover:border-secondary/50 hover:bg-muted'
                }`}
              >
                <span className="font-medium text-[9px]">{service.label}</span>
                {isSelected && (
                  <CheckCircle2 className="w-2.5 h-2.5 text-secondary" />
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-card border-border p-0 animate-scale-in">
        {/* Header */}
        <div className="bg-primary p-3 text-primary-foreground sticky top-0 z-10">
          <DialogHeader>
            <DialogTitle className="text-base font-display font-bold text-center flex items-center justify-center gap-2">
              <Truck className="w-4 h-4" />
              {mode === 'search' ? 'Área do Prestador' : mode === 'edit' ? 'Editar Cadastro' : 'Novo Cadastro'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-center text-[11px]">
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
  );
};

export default ProviderRegistrationModal;