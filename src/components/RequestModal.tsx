import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';
import { Car, Truck, Bike, Clock, AlertTriangle, Fuel, RotateCcw, Building2, CheckCircle2, RefreshCw, MessageCircle, Navigation, Users } from 'lucide-react';
import { toast } from 'sonner';
import MiniMap from '@/components/MiniMap';
import ProviderCard from '@/components/ProviderCard';
import { useProviders, Provider } from '@/hooks/useProviders';

interface RequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type VehicleType = 'carro' | 'moto' | 'caminhonete' | 'caminhao' | 'outros';
type VehicleCondition = 'pane' | 'seca' | 'capotado' | 'subsolo' | 'outros';

const vehicleTypes = [
  { id: 'carro' as VehicleType, label: 'Carro', icon: Car },
  { id: 'moto' as VehicleType, label: 'Moto', icon: Bike },
  { id: 'caminhonete' as VehicleType, label: 'Caminhonete', icon: Car },
  { id: 'caminhao' as VehicleType, label: 'Caminhão', icon: Truck },
  { id: 'outros' as VehicleType, label: 'Outros', icon: Car },
];

const vehicleConditions = [
  { id: 'pane' as VehicleCondition, label: 'Pane Mecânica', icon: AlertTriangle, color: 'text-amber-500' },
  { id: 'seca' as VehicleCondition, label: 'Sem Combustível', icon: Fuel, color: 'text-red-500' },
  { id: 'capotado' as VehicleCondition, label: 'Capotado', icon: RotateCcw, color: 'text-orange-500' },
  { id: 'subsolo' as VehicleCondition, label: 'Subsolo', icon: Building2, color: 'text-blue-500' },
  { id: 'outros' as VehicleCondition, label: 'Outros', icon: AlertTriangle, color: 'text-gray-500' },
];

const RequestModal: React.FC<RequestModalProps> = ({ open, onOpenChange }) => {
  const { location, refreshLocation } = useLocation();
  const { providers, loading: providersLoading } = useProviders();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<VehicleCondition | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canSubmit = name.length >= 2 && phone.length >= 14 && selectedVehicle && selectedCondition && selectedProvider;

  const handleSubmit = () => {
    if (!canSubmit || !selectedProvider) {
      toast.error('Por favor, preencha todos os campos e selecione um prestador');
      return;
    }

    const vehicleLabel = vehicleTypes.find(v => v.id === selectedVehicle)?.label;
    const conditionLabel = vehicleConditions.find(c => c.id === selectedCondition)?.label;
    
    const messageText = 
      `🚗 *NOVA SOLICITAÇÃO - ACHEI GUINCHO*\n\n` +
      `👤 *Cliente:* ${name}\n` +
      `📱 *WhatsApp:* ${phone}\n\n` +
      `🚙 *Tipo de Veículo:* ${vehicleLabel}\n` +
      `⚠️ *Situação:* ${conditionLabel}\n\n` +
      `📍 *Localização do Cliente:*\n${location.address}\n` +
      `🗺️ *Região:* ${location.region}\n` +
      `📐 *Coordenadas:* ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n\n` +
      `📏 *Distância até você:* ${selectedProvider.distance?.toFixed(1)} km\n` +
      `⏱️ *Tempo estimado:* ~${selectedProvider.estimatedTime} minutos\n\n` +
      `🕐 *Horário da Solicitação:* ${getCurrentTime()}\n\n` +
      `🔗 *Ver no Mapa:*\nhttps://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    
    const message = encodeURIComponent(messageText);

    // Use provider's WhatsApp number
    const whatsappNumber = selectedProvider.whatsapp.replace(/\D/g, '');
    const formattedNumber = whatsappNumber.startsWith('55') ? whatsappNumber : `55${whatsappNumber}`;
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;
    
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Abrindo WhatsApp...', {
      description: `Entrando em contato com ${selectedProvider.name}`,
      action: {
        label: 'Abrir WhatsApp',
        onClick: () => window.location.href = whatsappUrl,
      },
      duration: 10000,
    });
    
    setName('');
    setPhone('');
    setSelectedVehicle(null);
    setSelectedCondition(null);
    setSelectedProvider(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-[400px] sm:max-w-[500px] bg-card border-border p-0 animate-scale-in max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Header */}
        <div className="bg-primary p-3 sm:p-4 text-primary-foreground sticky top-0 z-10">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-display font-bold text-center">
              Solicitar Guincho
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-center text-xs sm:text-sm">
              Preencha os dados abaixo
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Map with Location */}
          <div className="rounded-lg overflow-hidden border border-border">
            <MiniMap className="h-[120px] sm:h-[140px] w-full" />
            
            <div className="p-2 sm:p-3 bg-muted">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4 text-secondary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground">Sua localização</p>
                  <p className="text-xs font-medium truncate">
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

          {/* Personal Info - Compact */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">Seu nome *</label>
              <Input
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">WhatsApp *</label>
              <Input
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={15}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Vehicle Type - Compact */}
          <div>
            <label className="block text-xs font-medium mb-2">Tipo de veículo *</label>
            <div className="flex flex-wrap gap-1.5">
              {vehicleTypes.map((vehicle) => {
                const Icon = vehicle.icon;
                const isSelected = selectedVehicle === vehicle.id;
                return (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all duration-200 text-xs ${
                      isSelected
                        ? 'border-secondary bg-secondary/10 text-secondary-foreground'
                        : 'border-border hover:border-secondary/50 hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{vehicle.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vehicle Condition - Compact */}
          <div>
            <label className="block text-xs font-medium mb-2">Situação do veículo *</label>
            <div className="flex flex-wrap gap-1.5">
              {vehicleConditions.map((condition) => {
                const Icon = condition.icon;
                const isSelected = selectedCondition === condition.id;
                return (
                  <button
                    key={condition.id}
                    onClick={() => setSelectedCondition(condition.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all duration-200 text-xs ${
                      isSelected
                        ? 'border-secondary bg-secondary/10'
                        : 'border-border hover:border-secondary/50 hover:bg-muted'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${condition.color}`} />
                    <span>{condition.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Providers - Compact */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium mb-2">
              <Users className="w-3.5 h-3.5" />
              Prestadores disponíveis
            </label>
            {providersLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-3 px-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Nenhum prestador disponível
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    isSelected={selectedProvider?.id === provider.id}
                    onSelect={() => setSelectedProvider(provider)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            variant="hero"
            size="default"
            className="w-full h-10"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Solicitar Guincho Agora
          </Button>

          {/* Footer */}
          <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-border">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              Atendimento 24h em todo o Brasil
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestModal;
