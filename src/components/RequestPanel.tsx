import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';
import { Car, Truck, Bike, Clock, AlertTriangle, Fuel, RotateCcw, Building2, CheckCircle2, RefreshCw, MessageCircle, Navigation, Users } from 'lucide-react';
import { toast } from 'sonner';
import MiniMap from '@/components/MiniMap';
import ProviderCard from '@/components/ProviderCard';
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

  const canSubmit = name.length >= 2 && phone.length >= 14 && selectedVehicle && selectedCondition;

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const vehicleLabel = vehicleTypes.find(v => v.id === selectedVehicle)?.label;
    const conditionLabel = vehicleConditions.find(c => c.id === selectedCondition)?.label;
    
    // Default WhatsApp number if no provider selected
    const defaultWhatsApp = '5562991429264';
    const providerInfo = selectedProvider 
      ? `\n📏 *Distância até você:* ${selectedProvider.distance?.toFixed(1)} km\n⏱️ *Tempo estimado:* ~${selectedProvider.estimatedTime} minutos\n`
      : '';
    
    const messageText = 
      `🚗 *NOVA SOLICITAÇÃO - ACHEI GUINCHO*\n\n` +
      `👤 *Cliente:* ${name}\n` +
      `📱 *WhatsApp:* ${phone}\n\n` +
      `🚙 *Tipo de Veículo:* ${vehicleLabel}\n` +
      `⚠️ *Situação:* ${conditionLabel}\n\n` +
      `📍 *Localização do Cliente:*\n${location.address}\n` +
      `🗺️ *Região:* ${location.region}\n` +
      `📐 *Coordenadas:* ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n` +
      providerInfo +
      `\n🕐 *Horário da Solicitação:* ${getCurrentTime()}\n\n` +
      `🔗 *Ver no Mapa:*\nhttps://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    
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
    setSelectedVehicle(null);
    setSelectedCondition(null);
    setSelectedProvider(null);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary p-4 text-primary-foreground">
        <div className="text-center">
          <h2 className="text-lg font-display font-bold">
            Solicitar Guincho
          </h2>
          <p className="text-primary-foreground/80 text-sm">
            Preencha os dados abaixo
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Map with Location */}
          <div className="rounded-xl overflow-hidden border border-border shadow-md" style={{ minHeight: '200px' }}>
            <MiniMap className="h-[160px] w-full" />
            
            <div className="p-4 bg-muted space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Navigation className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Sua localização atual</p>
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
                  title="Atualizar localização"
                >
                  <RefreshCw className={`w-4 h-4 ${location.loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Available Providers */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3">
              <Users className="w-4 h-4" />
              Prestadores na sua região *
            </label>
            {providersLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-6 px-4 bg-muted rounded-xl">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum prestador disponível na sua região no momento
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
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

          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Seu nome *</label>
              <Input
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp *</label>
              <Input
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={15}
                className="h-11"
              />
            </div>
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium mb-3">Tipo de veículo *</label>
            <div className="grid grid-cols-5 gap-2">
              {vehicleTypes.map((vehicle) => {
                const Icon = vehicle.icon;
                const isSelected = selectedVehicle === vehicle.id;
                return (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-secondary bg-secondary/10'
                        : 'border-border hover:border-secondary/50 hover:bg-muted'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-secondary text-secondary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-xs">{vehicle.label}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-secondary absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vehicle Condition */}
          <div>
            <label className="block text-sm font-medium mb-3">Situação do veículo *</label>
            <div className="grid grid-cols-2 gap-2">
              {vehicleConditions.map((condition) => {
                const Icon = condition.icon;
                const isSelected = selectedCondition === condition.id;
                return (
                  <button
                    key={condition.id}
                    onClick={() => setSelectedCondition(condition.id)}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-secondary bg-secondary/10'
                        : 'border-border hover:border-secondary/50 hover:bg-muted'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted shrink-0">
                      <Icon className={`w-5 h-5 ${condition.color}`} />
                    </div>
                    <span className="font-medium text-sm">{condition.label}</span>
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
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Solicitar Guincho Agora
          </Button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-border">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Atendimento 24h em todo o Brasil
          </span>
        </div>
      </div>
    </div>
  );
};

export default RequestPanel;
