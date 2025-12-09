import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';
import { Car, Truck, Bike, Clock, AlertTriangle, Fuel, RotateCcw, Building2, CheckCircle2, RefreshCw, MessageCircle, Navigation, Users, DollarSign, MapPin, Route } from 'lucide-react';
import { toast } from 'sonner';
import MiniMap from '@/components/MiniMap';
import ProviderCard from '@/components/ProviderCard';
import AddressAutocomplete, { DestinationCoordinates } from '@/components/AddressAutocomplete';
import { useProviders, Provider } from '@/hooks/useProviders';

type VehicleType = 'carro' | 'moto' | 'caminhonete' | 'caminhao' | 'outros';
type VehicleCondition = 'pane' | 'seca' | 'capotado' | 'subsolo' | 'roda_travada' | 'volante_travado' | 'precisa_patins' | 'outros';

const vehicleTypes = [
  { id: 'carro' as VehicleType, label: 'Carro', icon: Car },
  { id: 'moto' as VehicleType, label: 'Moto', icon: Bike },
  { id: 'caminhonete' as VehicleType, label: 'Caminhonete', icon: Car },
  { id: 'caminhao' as VehicleType, label: 'Caminhão', icon: Truck },
  { id: 'outros' as VehicleType, label: 'Outros', icon: Car },
];

// Conditions that require patins (additional equipment)
const PATINS_REQUIRED_CONDITIONS: VehicleCondition[] = ['subsolo', 'roda_travada', 'volante_travado', 'precisa_patins'];

const vehicleConditions = [
  { id: 'pane' as VehicleCondition, label: 'Pane Mecânica', icon: AlertTriangle, color: 'text-amber-500', needsPatins: false },
  { id: 'seca' as VehicleCondition, label: 'Sem Combustível', icon: Fuel, color: 'text-red-500', needsPatins: false },
  { id: 'capotado' as VehicleCondition, label: 'Capotado', icon: RotateCcw, color: 'text-orange-500', needsPatins: false },
  { id: 'subsolo' as VehicleCondition, label: 'Subsolo', icon: Building2, color: 'text-blue-500', needsPatins: true },
  { id: 'roda_travada' as VehicleCondition, label: 'Roda Travada', icon: AlertTriangle, color: 'text-purple-500', needsPatins: true },
  { id: 'volante_travado' as VehicleCondition, label: 'Volante Travado', icon: AlertTriangle, color: 'text-indigo-500', needsPatins: true },
  { id: 'precisa_patins' as VehicleCondition, label: 'Precisa Patins', icon: Building2, color: 'text-cyan-500', needsPatins: true },
  { id: 'outros' as VehicleCondition, label: 'Outros', icon: AlertTriangle, color: 'text-gray-500', needsPatins: false },
];

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const RequestPanel: React.FC = () => {
  const { location, refreshLocation } = useLocation();
  const { providers, loading: providersLoading } = useProviders();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<DestinationCoordinates | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<VehicleCondition | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // Check if selected condition requires patins
  const needsPatins = selectedCondition ? PATINS_REQUIRED_CONDITIONS.includes(selectedCondition) : false;

  // Calculate trip distance (client location → destination)
  const tripDistanceKm = destinationCoords && location.latitude && location.longitude
    ? calculateDistance(
        location.latitude,
        location.longitude,
        destinationCoords.latitude,
        destinationCoords.longitude
      )
    : 0;

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

  const handleDestinationChange = (value: string, coordinates?: DestinationCoordinates) => {
    setDestination(value);
    setDestinationCoords(coordinates || null);
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

  // Calculate total price based on trip distance
  const calculateTotalPrice = (provider: Provider) => {
    const basePrice = provider.base_price || 50;
    const pricePerKm = provider.price_per_km || 5;
    let total = basePrice + (tripDistanceKm * pricePerKm);
    
    if (needsPatins && provider.has_patins) {
      total += provider.patins_extra_price || 30;
    }
    return total;
  };

  const canSubmit = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10 && destination.trim().length >= 3 && selectedVehicle && selectedCondition;

  const getWhatsAppUrl = () => {
    const vehicleLabel = vehicleTypes.find(v => v.id === selectedVehicle)?.label || '';
    const conditionLabel = vehicleConditions.find(c => c.id === selectedCondition)?.label || '';
    
    const defaultWhatsApp = '5562994389675';
    
    let providerInfo = '';
    let priceInfo = '';
    let tripInfo = '';
    
    if (tripDistanceKm > 0) {
      tripInfo = `\n📏 *Distância do Trajeto:* ${tripDistanceKm.toFixed(1)} km\n`;
    }
    
    if (selectedProvider) {
      const totalPrice = calculateTotalPrice(selectedProvider);
      const basePrice = selectedProvider.base_price || 50;
      const pricePerKm = selectedProvider.price_per_km || 5;
      const patinsPrice = needsPatins && selectedProvider.has_patins ? (selectedProvider.patins_extra_price || 30) : 0;
      
      providerInfo = `\n🚚 *Prestador Selecionado:* ${selectedProvider.name}\n📍 *Distância do prestador:* ${selectedProvider.distance?.toFixed(1)} km\n⏱️ *Tempo estimado de chegada:* ~${selectedProvider.estimatedTime} min\n`;
      priceInfo = `\n💰 *VALOR ESTIMADO DO SERVIÇO:*\n` +
        `   Base: R$ ${basePrice.toFixed(2)}\n` +
        `   ${tripDistanceKm.toFixed(1)} km × R$ ${pricePerKm.toFixed(2)} = R$ ${(tripDistanceKm * pricePerKm).toFixed(2)}\n` +
        (patinsPrice > 0 ? `   Patins (subsolo): R$ ${patinsPrice.toFixed(2)}\n` : '') +
        `   *TOTAL: R$ ${totalPrice.toFixed(2)}*\n`;
    } else if (tripDistanceKm > 0) {
      // Show estimated price range without provider selected
      const minPrice = 50 + (tripDistanceKm * 3);
      const maxPrice = 100 + (tripDistanceKm * 8);
      priceInfo = `\n💰 *Valor Estimado:* R$ ${minPrice.toFixed(0)} - R$ ${maxPrice.toFixed(0)} (selecione um prestador para valor exato)\n`;
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
      (destinationCoords ? `📐 *Coordenadas Destino:* ${destinationCoords.latitude.toFixed(6)}, ${destinationCoords.longitude.toFixed(6)}\n` : '') +
      tripInfo +
      providerInfo +
      priceInfo +
      `\n🕐 *Horário da Solicitação:* ${getCurrentTime()}\n\n` +
      `🔗 *Ver no Mapa (Origem):*\nhttps://www.google.com/maps?q=${location.latitude},${location.longitude}` +
      (destinationCoords ? `\n\n🔗 *Ver no Mapa (Destino):*\nhttps://www.google.com/maps?q=${destinationCoords.latitude},${destinationCoords.longitude}` : '');
    
    const message = encodeURIComponent(messageText);

    const whatsappNumber = selectedProvider 
      ? selectedProvider.whatsapp.replace(/\D/g, '') 
      : defaultWhatsApp;
    const formattedNumber = whatsappNumber.startsWith('55') ? whatsappNumber : `55${whatsappNumber}`;
    
    return `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${message}`;
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
            onChange={handleDestinationChange}
            placeholder="Ex: Oficina do João, Rua das Flores, 123"
          />
          {tripDistanceKm > 0 && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600 dark:text-green-400">
              <Route className="w-3 h-3" />
              <span>Distância do trajeto: <strong>{tripDistanceKm.toFixed(1)} km</strong></span>
            </div>
          )}
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
          <div className="grid grid-cols-4 gap-0.5 sm:gap-1">
            {vehicleConditions.map((condition) => {
              const Icon = condition.icon;
              const isSelected = selectedCondition === condition.id;
              return (
                <button
                  key={condition.id}
                  onClick={() => setSelectedCondition(condition.id)}
                  className={`relative flex flex-col items-center gap-0.5 p-1 sm:p-1.5 rounded-md sm:rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-secondary bg-secondary/10'
                      : 'border-border hover:border-secondary/50 hover:bg-muted'
                  }`}
                >
                  <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${condition.color} shrink-0`} />
                  <span className="font-medium text-[7px] sm:text-[9px] text-center leading-tight">{condition.label}</span>
                  {condition.needsPatins && (
                    <span className="text-[6px] sm:text-[7px] text-cyan-600 dark:text-cyan-400 font-medium">+patins</span>
                  )}
                  {isSelected && (
                    <CheckCircle2 className="w-2 h-2 sm:w-3 sm:h-3 text-secondary absolute top-0 right-0" />
                  )}
                </button>
              );
            })}
          </div>
          {needsPatins && (
            <div className="mt-1.5 p-1.5 rounded-md bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
              <p className="text-[9px] sm:text-[10px] text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span><strong>Patins necessários:</strong> Será adicionado valor extra conforme tabela do prestador</span>
              </p>
            </div>
          )}
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
            <div className="grid grid-cols-1 gap-1 sm:gap-1.5 max-h-[140px] sm:max-h-[180px] overflow-y-auto pr-1">
              {providers.slice(0, 5).map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isSelected={selectedProvider?.id === provider.id}
                  onSelect={() => setSelectedProvider(provider)}
                  needsPatins={needsPatins}
                  tripDistanceKm={tripDistanceKm}
                />
              ))}
            </div>
          )}
        </div>

        {/* Selected Provider Price Summary */}
        {selectedProvider && tripDistanceKm > 0 && (
          <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <Route className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <span className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-400">
                  Trajeto: {tripDistanceKm.toFixed(1)} km
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <span className="text-[10px] sm:text-xs font-medium text-green-700 dark:text-green-400">
                  Valor estimado:
                </span>
              </div>
            </div>
            <span className="text-base sm:text-lg font-bold text-green-700 dark:text-green-400">
              R$ {calculateTotalPrice(selectedProvider).toFixed(2)}
            </span>
          </div>
        )}

        {/* Submit Button - Always visible */}
        {!canSubmit && (
          <p className="text-[9px] text-amber-600 dark:text-amber-400 text-center">
            {!destination || destination.trim().length < 3 ? '⚠️ Informe o destino' : 
             !name || name.trim().length < 2 ? '⚠️ Informe seu nome' :
             !phone || phone.replace(/\D/g, '').length < 10 ? '⚠️ Informe seu WhatsApp' :
             !selectedVehicle ? '⚠️ Selecione o tipo de veículo' :
             !selectedCondition ? '⚠️ Selecione a situação' : ''}
          </p>
        )}
        
        {canSubmit ? (
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-lg font-bold text-base bg-green-600 text-white hover:bg-green-700 active:bg-green-800 cursor-pointer shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            ENVIAR PARA WHATSAPP
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 w-full h-10 rounded-lg font-semibold text-sm bg-muted text-muted-foreground cursor-not-allowed">
            <MessageCircle className="w-4 h-4" />
            Preencha todos os campos
          </div>
        )}

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
