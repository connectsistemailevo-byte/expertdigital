import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';
import { Car, Truck, Bike, Clock, AlertTriangle, Fuel, RotateCcw, Building2, CheckCircle2, RefreshCw, MessageCircle, Navigation, Users, MapPin, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import MiniMap from '@/components/MiniMap';
import ProviderCard from '@/components/ProviderCard';
import AddressAutocomplete from '@/components/AddressAutocomplete';
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
  { id: 'pane' as VehicleCondition, label: 'Pane', icon: AlertTriangle, color: 'text-amber-500' },
  { id: 'seca' as VehicleCondition, label: 'Sem Comb.', icon: Fuel, color: 'text-red-500' },
  { id: 'capotado' as VehicleCondition, label: 'Capotado', icon: RotateCcw, color: 'text-orange-500' },
  { id: 'subsolo' as VehicleCondition, label: 'Subsolo', icon: Building2, color: 'text-blue-500' },
  { id: 'outros' as VehicleCondition, label: 'Outros', icon: AlertTriangle, color: 'text-gray-500' },
];

const RequestModal: React.FC<RequestModalProps> = ({ open, onOpenChange }) => {
  const { location, refreshLocation } = useLocation();
  const { providers, loading: providersLoading } = useProviders();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<VehicleCondition | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const needsPatins = selectedCondition === 'subsolo';

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

  const calculateTotalPrice = (provider: Provider) => {
    let total = provider.estimatedPrice || 0;
    if (needsPatins && provider.has_patins) {
      total += provider.patins_extra_price || 30;
    }
    return total;
  };

  const canSubmit = name.length >= 2 && phone.length >= 14 && destination.length >= 3 && selectedVehicle && selectedCondition;

  const getWhatsAppUrl = () => {
    const vehicleLabel = vehicleTypes.find(v => v.id === selectedVehicle)?.label || '';
    const conditionLabel = vehicleConditions.find(c => c.id === selectedCondition)?.label || '';
    
    const defaultWhatsApp = '5562991429264';
    
    let providerInfo = '';
    let priceInfo = '';
    
    if (selectedProvider) {
      const totalPrice = calculateTotalPrice(selectedProvider);
      providerInfo = `\n📏 *Distância até você:* ${selectedProvider.distance?.toFixed(1)} km\n⏱️ *Tempo estimado:* ~${selectedProvider.estimatedTime} minutos\n`;
      priceInfo = `\n💰 *Valor Estimado:* R$ ${totalPrice.toFixed(2)}${needsPatins ? ' (com patins)' : ''}\n`;
    }
    
    const messageText = 
      `🚗 *NOVA SOLICITAÇÃO - ACHEI GUINCHO*\n\n` +
      `👤 *Cliente:* ${name}\n` +
      `📱 *WhatsApp:* ${phone}\n\n` +
      `🚙 *Tipo de Veículo:* ${vehicleLabel}\n` +
      `⚠️ *Situação:* ${conditionLabel}\n\n` +
      `📍 *Localização do Cliente (ORIGEM):*\n${location.address}\n` +
      `🗺️ *Região:* ${location.region}\n` +
      `📐 *Coordenadas:* ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n\n` +
      `🏁 *Destino (PARA ONDE LEVAR):*\n${destination}\n` +
      providerInfo +
      priceInfo +
      `\n🕐 *Horário da Solicitação:* ${getCurrentTime()}\n\n` +
      `🔗 *Ver no Mapa (Origem):*\nhttps://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    
    const message = encodeURIComponent(messageText);

    const whatsappNumber = selectedProvider 
      ? selectedProvider.whatsapp.replace(/\D/g, '') 
      : defaultWhatsApp;
    const formattedNumber = whatsappNumber.startsWith('55') ? whatsappNumber : `55${whatsappNumber}`;
    
    return `https://wa.me/${formattedNumber}?text=${message}`;
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const url = getWhatsAppUrl();
    
    // Use location.href for better mobile compatibility
    window.location.href = url;
    
    toast.success('Abrindo WhatsApp...', {
      description: selectedProvider 
        ? `Entrando em contato com ${selectedProvider.name}` 
        : 'Entrando em contato com a central',
      duration: 3000,
    });
    
    // Reset form after short delay
    setTimeout(() => {
      setName('');
      setPhone('');
      setDestination('');
      setSelectedVehicle(null);
      setSelectedCondition(null);
      setSelectedProvider(null);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-[400px] sm:max-w-[500px] bg-card border-border p-0 animate-scale-in max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-2 sm:p-3 text-primary-foreground shrink-0">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base font-display font-bold text-center">
              Solicitar Guincho
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-center text-[10px] sm:text-xs">
              Preencha os dados abaixo
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Map with Location */}
          <div className="rounded-lg overflow-hidden border border-border">
            <MiniMap className="h-[80px] sm:h-[100px] w-full" />
            
            <div className="p-1.5 sm:p-2 bg-muted">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Navigation className="w-3 h-3 text-secondary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-muted-foreground">Sua localização</p>
                  <p className="text-[10px] sm:text-xs font-medium truncate">
                    {location.loading ? 'Buscando...' : location.error || location.address}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={refreshLocation}
                  className="shrink-0 h-6 w-6"
                  disabled={location.loading}
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${location.loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Destination Input */}
          <div>
            <label className="flex items-center gap-1 text-[10px] sm:text-xs font-medium mb-1">
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-secondary" />
              Para onde levar? *
            </label>
            <AddressAutocomplete
              value={destination}
              onChange={setDestination}
              placeholder="Ex: Oficina do João, Rua 123"
            />
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] sm:text-xs font-medium mb-0.5">Seu nome *</label>
              <Input
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-medium mb-0.5">WhatsApp *</label>
              <Input
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={15}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-[10px] sm:text-xs font-medium mb-1">Tipo de veículo *</label>
            <div className="flex flex-wrap gap-1">
              {vehicleTypes.map((vehicle) => {
                const Icon = vehicle.icon;
                const isSelected = selectedVehicle === vehicle.id;
                return (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] transition-all ${
                      isSelected
                        ? 'border-secondary bg-secondary/10 text-secondary-foreground'
                        : 'border-border hover:border-secondary/50'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{vehicle.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vehicle Condition */}
          <div>
            <label className="block text-[10px] sm:text-xs font-medium mb-1">Situação *</label>
            <div className="flex flex-wrap gap-1">
              {vehicleConditions.map((condition) => {
                const Icon = condition.icon;
                const isSelected = selectedCondition === condition.id;
                return (
                  <button
                    key={condition.id}
                    onClick={() => setSelectedCondition(condition.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] transition-all ${
                      isSelected
                        ? 'border-secondary bg-secondary/10'
                        : 'border-border hover:border-secondary/50'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${condition.color}`} />
                    <span>{condition.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Providers */}
          <div>
            <label className="flex items-center gap-1 text-[10px] sm:text-xs font-medium mb-1">
              <Users className="w-2.5 h-2.5" />
              Prestadores disponíveis
            </label>
            {providersLoading ? (
              <div className="flex items-center justify-center py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-2 px-2 bg-muted rounded-lg">
                <p className="text-[10px] text-muted-foreground">
                  Nenhum prestador disponível
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[80px] overflow-y-auto">
                {providers.slice(0, 3).map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    isSelected={selectedProvider?.id === provider.id}
                    onSelect={() => setSelectedProvider(provider)}
                    needsPatins={needsPatins}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Selected Provider Price Summary */}
          {selectedProvider && (
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-green-600" />
                <span className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-400">
                  Valor estimado:
                </span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-400">
                R$ {calculateTotalPrice(selectedProvider).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Fixed Footer with Submit Button */}
        <div className="shrink-0 p-2 sm:p-3 border-t border-border bg-card">
          {!canSubmit && (
            <p className="text-[9px] text-amber-600 dark:text-amber-400 text-center mb-1.5">
              {!destination ? '⚠️ Informe o destino' : 
               !name || name.length < 2 ? '⚠️ Informe seu nome' :
               !phone || phone.length < 14 ? '⚠️ Informe seu WhatsApp' :
               !selectedVehicle ? '⚠️ Selecione o tipo de veículo' :
               !selectedCondition ? '⚠️ Selecione a situação' : ''}
            </p>
          )}
          
          <a
            href={canSubmit ? getWhatsAppUrl() : undefined}
            onClick={(e) => {
              if (!canSubmit) {
                e.preventDefault();
                toast.error('Preencha todos os campos obrigatórios');
                return;
              }
              toast.success('Abrindo WhatsApp...');
              setTimeout(() => {
                setName('');
                setPhone('');
                setDestination('');
                setSelectedVehicle(null);
                setSelectedCondition(null);
                setSelectedProvider(null);
                onOpenChange(false);
              }, 500);
            }}
            className={`flex items-center justify-center gap-2 w-full h-10 rounded-lg font-semibold text-sm transition-all ${
              canSubmit 
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90 cursor-pointer' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Solicitar Guincho Agora
          </a>

          <div className="flex items-center justify-center gap-1 pt-2">
            <Clock className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">
              Atendimento 24h em todo o Brasil
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestModal;
