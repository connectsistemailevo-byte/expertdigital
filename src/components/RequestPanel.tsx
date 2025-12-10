import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';
import { Car, Truck, Bike, Clock, AlertTriangle, Fuel, RotateCcw, Building2, CheckCircle2, RefreshCw, MessageCircle, Navigation, Users, DollarSign, MapPin, Route, CreditCard, Banknote, QrCode, Landmark } from 'lucide-react';
import MiniMap from '@/components/MiniMap';
import ProviderCard from '@/components/ProviderCard';
import AddressAutocomplete, { DestinationCoordinates } from '@/components/AddressAutocomplete';
import { useProviders, Provider } from '@/hooks/useProviders';

type VehicleType = 'carro' | 'moto' | 'caminhonete' | 'caminhao' | 'outros';
type VehicleCondition = 'pane' | 'seca' | 'capotado' | 'subsolo' | 'roda_travada' | 'volante_travado' | 'precisa_patins' | 'outros';
type PaymentMethod = 'pix' | 'dinheiro' | 'credito' | 'debito';

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

const paymentMethods = [
  { id: 'pix' as PaymentMethod, label: 'PIX', icon: QrCode, color: 'text-teal-500' },
  { id: 'dinheiro' as PaymentMethod, label: 'Dinheiro', icon: Banknote, color: 'text-green-500' },
  { id: 'credito' as PaymentMethod, label: 'Crédito', icon: CreditCard, color: 'text-blue-500' },
  { id: 'debito' as PaymentMethod, label: 'Débito', icon: Landmark, color: 'text-purple-500' },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
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
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);

  const needsPatins = selectedCondition ? PATINS_REQUIRED_CONDITIONS.includes(selectedCondition) : false;
  const tripDistanceKm = destinationCoords && location.latitude && location.longitude
    ? calculateDistance(location.latitude, location.longitude, destinationCoords.latitude, destinationCoords.longitude)
    : 0;

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => setPhone(formatPhone(e.target.value));
  const handleDestinationChange = (value: string, coordinates?: DestinationCoordinates) => {
    setDestination(value);
    setDestinationCoords(coordinates || null);
  };

  const getCurrentTime = () => new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const calculateTotalPrice = (provider: Provider) => {
    const basePrice = provider.base_price || 50;
    const pricePerKm = provider.price_per_km || 5;
    let total = basePrice + (tripDistanceKm * pricePerKm);
    if (needsPatins && provider.has_patins) total += provider.patins_extra_price || 30;
    return total;
  };

  const canSubmit = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10 && destination.trim().length >= 3 && selectedVehicle && selectedCondition && selectedPayment;

  const getWhatsAppUrl = () => {
    const vehicleLabel = vehicleTypes.find(v => v.id === selectedVehicle)?.label || '';
    const conditionLabel = vehicleConditions.find(c => c.id === selectedCondition)?.label || '';
    const paymentLabel = paymentMethods.find(p => p.id === selectedPayment)?.label || '';
    const defaultWhatsApp = '5562994389675';
    
    let providerInfo = '', priceInfo = '', tripInfo = '';
    if (tripDistanceKm > 0) tripInfo = `\n📏 *Distância do Trajeto:* ${tripDistanceKm.toFixed(1)} km\n`;
    
    if (selectedProvider) {
      const totalPrice = calculateTotalPrice(selectedProvider);
      providerInfo = `\n🚚 *Prestador:* ${selectedProvider.name}\n`;
      priceInfo = `\n💰 *TOTAL: R$ ${totalPrice.toFixed(2)}*\n`;
    }
    
    const messageText = `🚗 *GUINCHO FÁCIL 24HS*\n\n👤 *Cliente:* ${name}\n📱 *WhatsApp:* ${phone}\n\n🚙 *Veículo:* ${vehicleLabel}\n⚠️ *Situação:* ${conditionLabel}\n💳 *Pagamento:* ${paymentLabel}\n\n📍 *Origem:*\n${location.address}\n\n🏁 *Destino:*\n${destination}\n${tripInfo}${providerInfo}${priceInfo}\n🕐 *Horário:* ${getCurrentTime()}`;
    
    const message = encodeURIComponent(messageText);
    const whatsappNumber = selectedProvider ? selectedProvider.whatsapp.replace(/\D/g, '') : defaultWhatsApp;
    const formattedNumber = whatsappNumber.startsWith('55') ? whatsappNumber : `55${whatsappNumber}`;
    return `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${message}`;
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary p-3 text-primary-foreground">
        <div className="text-center">
          <h2 className="text-base font-display font-bold">Solicitar Guincho</h2>
          <p className="text-primary-foreground/80 text-xs">Preencha os dados abaixo</p>
        </div>
      </div>

      {/* Content - 3 Column HORIZONTAL Layout */}
      <div className="p-3 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Column 1: Inputs on TOP, Map below */}
          <div className="space-y-3">
            {/* Location display - compact */}
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Navigation className="w-3 h-3 text-secondary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground">Sua localização</p>
                <p className="text-xs font-medium truncate">
                  {location.loading ? 'Buscando...' : location.error || location.address}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={refreshLocation} className="shrink-0 h-6 w-6" disabled={location.loading}>
                <RefreshCw className={`w-3 h-3 ${location.loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Destination */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium mb-1">
                <MapPin className="w-3 h-3 text-secondary" />
                Para onde levar o veículo? *
              </label>
              <AddressAutocomplete value={destination} onChange={handleDestinationChange} placeholder="Ex: Oficina do João, Rua das Flores, 123" />
              {tripDistanceKm > 0 && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600">
                  <Route className="w-3 h-3" />
                  <span>Distância: <strong>{tripDistanceKm.toFixed(1)} km</strong></span>
                </div>
              )}
            </div>

            {/* Name/Phone */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Seu nome *</label>
                <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">WhatsApp *</label>
                <Input placeholder="(00) 00000-0000" value={phone} onChange={handlePhoneChange} maxLength={15} className="h-9 text-sm" />
              </div>
            </div>

            {/* Map - compact at bottom */}
            <div className="rounded-lg overflow-hidden border border-border shadow-sm">
              <MiniMap className="h-16 w-full" />
            </div>
          </div>

          {/* Column 2: Vehicle Type + Condition */}
          <div className="space-y-3">
            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-medium mb-2">Tipo de veículo *</label>
              <div className="grid grid-cols-5 gap-1.5">
                {vehicleTypes.map((vehicle) => {
                  const Icon = vehicle.icon;
                  const isSelected = selectedVehicle === vehicle.id;
                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                      className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
                        isSelected 
                          ? 'border-secondary bg-gradient-to-br from-secondary/20 to-secondary/5 shadow-secondary/20' 
                          : 'border-border/50 hover:border-secondary/50 hover:bg-muted/50 bg-card'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-gradient-to-br from-secondary to-amber-500 text-white shadow-lg shadow-secondary/30' 
                          : 'bg-gradient-to-br from-muted to-muted/50'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`font-semibold text-[10px] text-center leading-tight ${isSelected ? 'text-secondary' : ''}`}>
                        {vehicle.label}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Condition */}
            <div>
              <label className="block text-xs font-medium mb-2">Situação do veículo *</label>
              <div className="grid grid-cols-4 gap-1.5">
                {vehicleConditions.map((condition) => {
                  const Icon = condition.icon;
                  const isSelected = selectedCondition === condition.id;
                  return (
                    <button
                      key={condition.id}
                      onClick={() => setSelectedCondition(condition.id)}
                      className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
                        isSelected 
                          ? 'border-secondary bg-gradient-to-br from-secondary/20 to-secondary/5 shadow-secondary/20' 
                          : 'border-border/50 hover:border-secondary/50 hover:bg-muted/50 bg-card'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-white shadow-md' : 'bg-muted/50'
                      }`}>
                        <Icon className={`w-5 h-5 ${condition.color}`} />
                      </div>
                      <span className={`font-semibold text-[8px] text-center leading-tight ${isSelected ? 'text-secondary' : ''}`}>
                        {condition.label}
                      </span>
                      {condition.needsPatins && (
                        <span className="text-[7px] font-medium text-cyan-600 bg-cyan-100 px-1.5 py-0.5 rounded-full">+patins</span>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium mb-2">
                <CreditCard className="w-3 h-3 text-secondary" />
                Forma de pagamento *
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {paymentMethods.map((payment) => {
                  const Icon = payment.icon;
                  const isSelected = selectedPayment === payment.id;
                  return (
                    <button
                      key={payment.id}
                      onClick={() => setSelectedPayment(payment.id)}
                      className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
                        isSelected 
                          ? 'border-secondary bg-gradient-to-br from-secondary/20 to-secondary/5 shadow-secondary/20' 
                          : 'border-border/50 hover:border-secondary/50 hover:bg-muted/50 bg-card'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-white shadow-md' : 'bg-muted/50'
                      }`}>
                        <Icon className={`w-5 h-5 ${payment.color}`} />
                      </div>
                      <span className={`font-semibold text-[9px] text-center leading-tight ${isSelected ? 'text-secondary' : ''}`}>
                        {payment.label}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 3: Providers + Submit */}
          <div className="space-y-3">
            {/* Providers */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium mb-2">
                <Users className="w-3 h-3" />
                Prestadores disponíveis
              </label>
              {providersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-4 bg-muted rounded-lg">
                  <Users className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Nenhum prestador na região</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                  {providers.slice(0, 4).map((provider) => (
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
              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Valor estimado:</span>
                </div>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">
                  R$ {calculateTotalPrice(selectedProvider).toFixed(2)}
                </span>
              </div>
            )}

            {/* Validation */}
            {!canSubmit && (
              <p className="text-[10px] text-amber-600 text-center">
                {!destination ? '⚠️ Informe o destino' : 
                 !name ? '⚠️ Informe seu nome' :
                 !phone || phone.replace(/\D/g, '').length < 10 ? '⚠️ Informe seu WhatsApp' :
                 !selectedVehicle ? '⚠️ Selecione o veículo' :
                 !selectedCondition ? '⚠️ Selecione a situação' :
                 !selectedPayment ? '⚠️ Selecione forma de pagamento' : ''}
              </p>
            )}

            {/* Submit */}
            {canSubmit ? (
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-lg font-bold text-sm bg-green-600 text-white hover:bg-green-700 shadow-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                ENVIAR PARA WHATSAPP
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full h-11 rounded-lg font-semibold text-sm bg-muted text-muted-foreground cursor-not-allowed">
                <MessageCircle className="w-4 h-4" />
                Preencha todos os campos
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-border">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Atendimento 24h em todo o Brasil</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestPanel;
