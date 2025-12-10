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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

  const needsPatins = selectedCondition ? PATINS_REQUIRED_CONDITIONS.includes(selectedCondition) : false;

  const tripDistanceKm = destinationCoords && location.latitude && location.longitude
    ? calculateDistance(location.latitude, location.longitude, destinationCoords.latitude, destinationCoords.longitude)
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
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

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
    }
    
    const messageText = 
      `🚗 *NOVA SOLICITAÇÃO - GUINCHO FÁCIL 24HS*\n\n` +
      `👤 *Cliente:* ${name}\n` +
      `📱 *WhatsApp:* ${phone}\n\n` +
      `🚙 *Tipo de Veículo:* ${vehicleLabel}\n` +
      `⚠️ *Situação:* ${conditionLabel}\n\n` +
      `📍 *Localização do Cliente (ORIGEM):*\n${location.address}\n` +
      `🗺️ *Região:* ${location.region}\n\n` +
      `🏁 *Destino (PARA ONDE LEVAR):*\n${destination}\n` +
      tripInfo + providerInfo + priceInfo +
      `\n🕐 *Horário da Solicitação:* ${getCurrentTime()}\n\n` +
      `🔗 *Ver no Mapa (Origem):*\nhttps://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    
    const message = encodeURIComponent(messageText);
    const whatsappNumber = selectedProvider ? selectedProvider.whatsapp.replace(/\D/g, '') : defaultWhatsApp;
    const formattedNumber = whatsappNumber.startsWith('55') ? whatsappNumber : `55${whatsappNumber}`;
    
    return `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${message}`;
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-2xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-primary p-2 text-primary-foreground shrink-0">
        <div className="text-center">
          <h2 className="text-sm md:text-base font-display font-bold">Solicitar Guincho</h2>
          <p className="text-primary-foreground/80 text-[10px]">Preencha os dados abaixo</p>
        </div>
      </div>

      {/* Content - HORIZONTAL Grid Layout on desktop */}
      <div className="p-2 md:p-3 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
          
          {/* Column 1: Map + Location + Destination + Name/Phone */}
          <div className="space-y-2">
            {/* Map */}
            <div className="rounded-lg overflow-hidden border border-border">
              <MiniMap className="h-[60px] md:h-[70px] w-full" />
              <div className="p-1.5 bg-muted">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Navigation className="w-2.5 h-2.5 text-secondary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] text-muted-foreground">Sua localização</p>
                    <p className="text-[9px] font-medium truncate">
                      {location.loading ? 'Buscando...' : location.error || location.address}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={refreshLocation} className="shrink-0 h-5 w-5" disabled={location.loading}>
                    <RefreshCw className={`w-2 h-2 ${location.loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="flex items-center gap-1 text-[9px] font-medium mb-0.5">
                <MapPin className="w-2 h-2 text-secondary" />
                Para onde levar? *
              </label>
              <AddressAutocomplete value={destination} onChange={handleDestinationChange} placeholder="Ex: Oficina, Rua..." />
              {tripDistanceKm > 0 && (
                <div className="flex items-center gap-1 mt-0.5 text-[8px] text-green-600">
                  <Route className="w-2 h-2" />
                  <span>Distância: <strong>{tripDistanceKm.toFixed(1)} km</strong></span>
                </div>
              )}
            </div>

            {/* Name/Phone */}
            <div className="grid grid-cols-2 gap-1">
              <div>
                <label className="block text-[9px] font-medium mb-0.5">Seu nome *</label>
                <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className="h-6 text-[10px]" />
              </div>
              <div>
                <label className="block text-[9px] font-medium mb-0.5">WhatsApp *</label>
                <Input placeholder="(00) 00000-0000" value={phone} onChange={handlePhoneChange} maxLength={15} className="h-6 text-[10px]" />
              </div>
            </div>
          </div>

          {/* Column 2: Vehicle Type + Condition */}
          <div className="space-y-2">
            {/* Vehicle Type */}
            <div>
              <label className="block text-[9px] font-medium mb-1">Tipo de veículo *</label>
              <div className="grid grid-cols-5 gap-0.5">
                {vehicleTypes.map((vehicle) => {
                  const Icon = vehicle.icon;
                  const isSelected = selectedVehicle === vehicle.id;
                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                      className={`relative flex flex-col items-center gap-0.5 p-1 rounded-md border-2 transition-all ${
                        isSelected ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? 'bg-secondary text-secondary-foreground' : 'bg-muted'}`}>
                        <Icon className="w-2.5 h-2.5" />
                      </div>
                      <span className="font-medium text-[7px] text-center leading-tight">{vehicle.label}</span>
                      {isSelected && <CheckCircle2 className="w-2 h-2 text-secondary absolute top-0 right-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Condition */}
            <div>
              <label className="block text-[9px] font-medium mb-1">Situação do veículo *</label>
              <div className="grid grid-cols-4 gap-0.5">
                {vehicleConditions.map((condition) => {
                  const Icon = condition.icon;
                  const isSelected = selectedCondition === condition.id;
                  return (
                    <button
                      key={condition.id}
                      onClick={() => setSelectedCondition(condition.id)}
                      className={`relative flex flex-col items-center gap-0.5 p-1 rounded-md border-2 transition-all ${
                        isSelected ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/50'
                      }`}
                    >
                      <Icon className={`w-2.5 h-2.5 ${condition.color}`} />
                      <span className="font-medium text-[6px] text-center leading-tight">{condition.label}</span>
                      {condition.needsPatins && <span className="text-[5px] text-cyan-600">+patins</span>}
                      {isSelected && <CheckCircle2 className="w-2 h-2 text-secondary absolute top-0 right-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 3: Providers + Submit */}
          <div className="space-y-2">
            {/* Providers */}
            <div>
              <label className="flex items-center gap-1 text-[9px] font-medium mb-1">
                <Users className="w-2 h-2" />
                Prestadores disponíveis
              </label>
              {providersLoading ? (
                <div className="flex items-center justify-center py-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-2 bg-muted rounded-lg">
                  <Users className="w-4 h-4 text-muted-foreground mx-auto mb-0.5" />
                  <p className="text-[8px] text-muted-foreground">Nenhum prestador na região</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1 max-h-[100px] overflow-y-auto">
                  {providers.slice(0, 3).map((provider) => (
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

            {/* Price Summary */}
            {selectedProvider && tripDistanceKm > 0 && (
              <div className="flex items-center justify-between p-1.5 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-green-600" />
                  <span className="text-[9px] font-medium text-green-700 dark:text-green-400">Valor estimado:</span>
                </div>
                <span className="text-sm font-bold text-green-700 dark:text-green-400">
                  R$ {calculateTotalPrice(selectedProvider).toFixed(2)}
                </span>
              </div>
            )}

            {/* Validation Message */}
            {!canSubmit && (
              <p className="text-[8px] text-amber-600 text-center">
                {!destination ? '⚠️ Informe o destino' : 
                 !name ? '⚠️ Informe seu nome' :
                 !phone || phone.replace(/\D/g, '').length < 10 ? '⚠️ Informe seu WhatsApp' :
                 !selectedVehicle ? '⚠️ Selecione o veículo' :
                 !selectedCondition ? '⚠️ Selecione a situação' : ''}
              </p>
            )}

            {/* Submit Button */}
            {canSubmit ? (
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg font-bold text-xs bg-green-600 text-white hover:bg-green-700 shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                ENVIAR PARA WHATSAPP
              </a>
            ) : (
              <div className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg font-semibold text-xs bg-muted text-muted-foreground cursor-not-allowed">
                <MessageCircle className="w-3 h-3" />
                Preencha todos os campos
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-center gap-1 pt-1 border-t border-border">
              <Clock className="w-2 h-2 text-muted-foreground" />
              <span className="text-[8px] text-muted-foreground">Atendimento 24h em todo o Brasil</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestPanel;
