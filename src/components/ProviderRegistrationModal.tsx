import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocation } from '@/contexts/LocationContext';
import { MapPin, Truck, RefreshCw, CheckCircle2, UserPlus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import MiniMap from '@/components/MiniMap';

interface ProviderRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const serviceOptions = [
  { id: 'moto', label: 'Somente Moto' },
  { id: 'carro_popular', label: 'Carro Popular' },
  { id: 'sedan', label: 'Sedan' },
  { id: 'suv', label: 'SUVs' },
  { id: 'utilitarios_pesados', label: 'Utilitários Pesados' },
  { id: 'guincho_completo', label: 'Guincho Completo' },
];

const ProviderRegistrationModal: React.FC<ProviderRegistrationModalProps> = ({ open, onOpenChange }) => {
  const { location, refreshLocation } = useLocation();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [hasPatins, setHasPatins] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState('50');
  const [pricePerKm, setPricePerKm] = useState('5');
  const [patinsExtraPrice, setPatinsExtraPrice] = useState('30');
  const [isLoading, setIsLoading] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhone(e.target.value));
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

      setName('');
      setWhatsapp('');
      setHasPatins(false);
      setSelectedServices([]);
      setBasePrice('50');
      setPricePerKm('5');
      setPatinsExtraPrice('30');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error registering provider:', error);
      toast.error('Erro ao cadastrar', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto bg-card border-border p-0 animate-scale-in">
        {/* Header */}
        <div className="bg-primary p-4 text-primary-foreground sticky top-0 z-10">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-bold text-center flex items-center justify-center gap-2">
              <Truck className="w-5 h-5" />
              Cadastro de Prestador
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-center text-xs">
              Cadastre-se para receber solicitações de guincho
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-4">
          {/* Location Map */}
          <div className="rounded-xl overflow-hidden border border-border">
            <MiniMap className="h-[120px] w-full" />
            
            <div className="p-3 bg-muted">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-secondary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Sua localização</p>
                  <p className="text-xs font-medium truncate">
                    {location.loading ? 'Buscando...' : location.error || location.address}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={refreshLocation}
                  className="shrink-0 h-8 w-8"
                  disabled={location.loading}
                >
                  <RefreshCw className={`w-3 h-3 ${location.loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Nome *</label>
              <Input
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">WhatsApp *</label>
              <Input
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={handlePhoneChange}
                maxLength={15}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="p-3 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Tabela de Preços</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1">Preço Base (R$)</label>
                <Input
                  type="number"
                  placeholder="50"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="h-8 text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1">Por KM (R$)</label>
                <Input
                  type="number"
                  placeholder="5"
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(e.target.value)}
                  className="h-8 text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1">Extra Patins (R$)</label>
                <Input
                  type="number"
                  placeholder="30"
                  value={patinsExtraPrice}
                  onChange={(e) => setPatinsExtraPrice(e.target.value)}
                  className="h-8 text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Has Patins */}
          <div className="flex items-center space-x-2 p-3 rounded-xl border border-border bg-muted/50">
            <Checkbox
              id="hasPatins"
              checked={hasPatins}
              onCheckedChange={(checked) => setHasPatins(checked === true)}
            />
            <label
              htmlFor="hasPatins"
              className="text-xs font-medium cursor-pointer"
            >
              Possui patins (skates) para remoção de veículos travados
            </label>
          </div>

          {/* Service Types */}
          <div>
            <label className="block text-xs font-medium mb-2">Tipos de serviço *</label>
            <div className="grid grid-cols-3 gap-2">
              {serviceOptions.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`relative flex items-center justify-center gap-1 p-2 rounded-lg border-2 transition-all duration-200 text-center ${
                      isSelected
                        ? 'border-secondary bg-secondary/10'
                        : 'border-border hover:border-secondary/50 hover:bg-muted'
                    }`}
                  >
                    <span className="font-medium text-[10px]">{service.label}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-3 h-3 text-secondary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            variant="hero"
            size="lg"
            className="w-full h-10"
            disabled={!canSubmit || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Cadastrando...' : 'Cadastrar como Prestador'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderRegistrationModal;