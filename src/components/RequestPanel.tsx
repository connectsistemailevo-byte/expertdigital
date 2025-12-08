import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';
import { Car, Truck, Bike, Clock, AlertTriangle, Fuel, RotateCcw, Building2, CheckCircle2, RefreshCw, MessageCircle, Navigation, Users, DollarSign, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import MiniMap from '@/components/MiniMap';
import ProviderCard from '@/components/ProviderCard';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useProviders, Provider } from '@/hooks/useProviders';

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

const RequestPanel: React.FC = () => {
  const { location, refreshLocation } = useLocation();
  const { providers, loading: providersLoading } = useProviders();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<VehicleCondition | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // Check if subsolo condition requires patins
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

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const vehicleLabel = vehicleTypes.find(v => v.id === selectedVehicle)?.label;
    const conditionLabel = vehicleConditions.find(c => c.id === selectedCondition)?.label;
    
    // Default WhatsApp number if no provider selected
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
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    toast.success('Abrindo WhatsApp...', {
      description: selectedProvider 
        ? `Entrando em contato com ${selectedProvider.name}` 
        : 'Entrando em contato com a central',
      duration: 5000,
    });
    
    setName('');
    setPhone('');
    setDestination('');
    setSelectedVehicle(null);
    setSelectedCondition(null);
    setSelectedProvider(null);
  };

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-none overflow-y-auto">
      {/* Header */}
      <div className="bg-primary p-2 sm:p-3 text-primary-foreground sticky top-0 z-10">
        <div className="text-center">
          <h2 className="text-sm sm:text-base font-display font-bold">
            Solicitar Guincho
          </h2>
          <p className="text-primary-foreground/80 text-[10px] sm:text-xs">
            Preencha os dados abaixo
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
        {/* Map with Location - Compact */}
        <div className="rounded-lg sm:rounded-xl overflow-hidden border border-border shadow-md">
          <MiniMap className="h-[80px] sm:h-[100px] w-full" />
          
          <div className="p-1.5 sm:p-2 bg-muted">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Navigation className="w-3 h-3 sm:w-4 sm:h-4 text-secondary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">Sua localização</p>
                <p className="text-[10px] sm:text-xs font-medium truncate">
                  {location.loading ? 'Buscando...' : location.error || location.address}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={refreshLocation}
                className="shrink-0 h-6 w-6 sm:h-7 sm:w-7"
                disabled={location.loading}
              >
                <RefreshCw className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${location.loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Destination Input */}
        <div>
          <label className="flex items-center gap-1 text-[10px] sm:text-xs font-medium mb-1">
            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-secondary" />
            Para onde levar o veículo? *
          </label>
          <AddressAutocomplete
            value={destination}
            onChange={setDestination}
            placeholder="Ex: Oficina do João, Rua das Flores, 123"
          />
        </div>

        {/* Personal Info - Compact */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <div>
            <label className="block text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1">Seu nome *</label>
            <Input
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1">WhatsApp *</label>
            <Input
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={15}
              className="h-8 sm:h-9 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Vehicle Type - Compact */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium mb-1 sm:mb-2">Tipo de veículo *</label>
          <div className="grid grid-cols-5 gap-0.5 sm:gap-1">
            {vehicleTypes.map((vehicle) => {
              const Icon = vehicle.icon;
              const isSelected = selectedVehicle === vehicle.id;
              return (
                <button
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`relative flex flex-col items-center gap-0.5 sm:gap-1 p-1 sm:p-2 rounded-md sm:rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-secondary bg-secondary/10'
                      : 'border-border hover:border-secondary/50 hover:bg-muted'
                  }`}
                >
                  <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-secondary text-secondary-foreground' : 'bg-muted'
                  }`}>
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <span className="font-medium text-[8px] sm:text-[10px] text-center leading-tight">{vehicle.label}</span>
                  {isSelected && (
                    <CheckCircle2 className="w-2 h-2 sm:w-3 sm:h-3 text-secondary absolute top-0 right-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Condition - Compact */}
        <div>
          <label className="block text-[10px] sm:text-xs font-medium mb-1 sm:mb-2">Situação do veículo *</label>
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
            {vehicleConditions.map((condition) => {
              const Icon = condition.icon;
              const isSelected = selectedCondition === condition.id;
              return (
                <button
                  key={condition.id}
                  onClick={() => setSelectedCondition(condition.id)}
                  className={`relative flex items-center gap-1 p-1.5 sm:p-2 rounded-md sm:rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-secondary bg-secondary/10'
                      : 'border-border hover:border-secondary/50 hover:bg-muted'
                  }`}
                >
                  <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${condition.color} shrink-0`} />
                  <span className="font-medium text-[8px] sm:text-[10px] truncate">{condition.label}</span>
                  {isSelected && (
                    <CheckCircle2 className="w-2 h-2 sm:w-3 sm:h-3 text-secondary absolute top-0 right-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Available Providers - Compact */}
        <div>
          <label className="flex items-center gap-1 text-[10px] sm:text-xs font-medium mb-1 sm:mb-2">
            <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            Prestadores disponíveis
          </label>
          {providersLoading ? (
            <div className="flex items-center justify-center py-3 sm:py-4">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-muted-foreground" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-2 sm:py-3 px-2 sm:px-3 bg-muted rounded-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                Nenhum prestador na região
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1 sm:gap-1.5 max-h-[100px] sm:max-h-[140px] overflow-y-auto pr-1">
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
          <div className="flex items-center justify-between p-1.5 sm:p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              <span className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-400">
                Valor estimado:
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-400">
              R$ {calculateTotalPrice(selectedProvider).toFixed(2)}
            </span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          variant="hero"
          size="lg"
          className="w-full h-9 sm:h-10 text-xs sm:text-sm"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Solicitar Guincho Agora
        </Button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1 pt-1.5 sm:pt-2 border-t border-border">
          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
          <span className="text-[9px] sm:text-[10px] text-muted-foreground">
            Atendimento 24h em todo o Brasil
          </span>
        </div>
      </div>
    </div>
  );
};

export default RequestPanel;