import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocation } from '@/contexts/LocationContext';
import { MapPin, Truck, RefreshCw, CheckCircle2, UserPlus } from 'lucide-react';
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
      });

      if (error) throw error;

      toast.success('Cadastro realizado com sucesso!', {
        description: 'Você já está disponível para receber solicitações na sua região.',
      });

      setName('');
      setWhatsapp('');
      setHasPatins(false);
      setSelectedServices([]);
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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-card border-border p-0 animate-scale-in">
        {/* Header */}
        <div className="bg-primary p-5 text-primary-foreground sticky top-0 z-10">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-center flex items-center justify-center gap-2">
              <Truck className="w-6 h-6" />
              Cadastro de Prestador
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-center text-sm">
              Cadastre-se para receber solicitações de guincho na sua região
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-5">
          {/* Location Map */}
          <div className="rounded-xl overflow-hidden border border-border" style={{ minHeight: '180px' }}>
            <MiniMap className="h-[140px] w-full" />
            
            <div className="p-4 bg-muted">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Sua localização</p>
                  <p className="text-sm font-medium">
                    {location.loading ? 'Buscando localização...' : location.error || location.address}
                  </p>
                  {!location.loading && !location.error && (
                    <p className="text-xs text-muted-foreground mt-0.5">{location.region}</p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={refreshLocation}
                  className="shrink-0"
                  disabled={location.loading}
                >
                  <RefreshCw className={`w-4 h-4 ${location.loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome completo *</label>
              <Input
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp *</label>
              <Input
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={handlePhoneChange}
                maxLength={15}
                className="h-11"
              />
            </div>
          </div>

          {/* Has Patins */}
          <div className="flex items-center space-x-3 p-4 rounded-xl border border-border bg-muted/50">
            <Checkbox
              id="hasPatins"
              checked={hasPatins}
              onCheckedChange={(checked) => setHasPatins(checked === true)}
            />
            <label
              htmlFor="hasPatins"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Possui patins (skates) para remoção de veículos travados
            </label>
          </div>

          {/* Service Types */}
          <div>
            <label className="block text-sm font-medium mb-3">Tipos de serviço que realiza *</label>
            <div className="grid grid-cols-2 gap-2">
              {serviceOptions.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-secondary bg-secondary/10'
                        : 'border-border hover:border-secondary/50 hover:bg-muted'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-secondary text-secondary-foreground' : 'bg-muted'
                    }`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">{service.label}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-secondary absolute top-2 right-2" />
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
            className="w-full"
            disabled={!canSubmit || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <UserPlus className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'Cadastrando...' : 'Cadastrar como Prestador'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderRegistrationModal;
