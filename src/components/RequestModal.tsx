import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';
import { Car, Truck, Bike, MapPin, Clock, AlertTriangle, Fuel, RotateCcw, Building2, CheckCircle2, RefreshCw, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type VehicleType = 'carro' | 'moto' | 'caminhonete' | 'caminhao';
type VehicleCondition = 'pane' | 'seca' | 'capotado' | 'subsolo';

const vehicleTypes = [
  { id: 'carro' as VehicleType, label: 'Carro', icon: Car },
  { id: 'moto' as VehicleType, label: 'Moto', icon: Bike },
  { id: 'caminhonete' as VehicleType, label: 'Caminhonete', icon: Car },
  { id: 'caminhao' as VehicleType, label: 'Caminhão', icon: Truck },
];

const vehicleConditions = [
  { id: 'pane' as VehicleCondition, label: 'Pane Mecânica', icon: AlertTriangle, color: 'text-amber-500' },
  { id: 'seca' as VehicleCondition, label: 'Sem Combustível', icon: Fuel, color: 'text-red-500' },
  { id: 'capotado' as VehicleCondition, label: 'Capotado', icon: RotateCcw, color: 'text-orange-500' },
  { id: 'subsolo' as VehicleCondition, label: 'Subsolo', icon: Building2, color: 'text-blue-500' },
];

const RequestModal: React.FC<RequestModalProps> = ({ open, onOpenChange }) => {
  const { location, refreshLocation } = useLocation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<VehicleCondition | null>(null);

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
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    const vehicleLabel = vehicleTypes.find(v => v.id === selectedVehicle)?.label;
    const conditionLabel = vehicleConditions.find(c => c.id === selectedCondition)?.label;
    
    const message = encodeURIComponent(
      `🚗 *NOVA SOLICITAÇÃO - ACHEI GUINCHO*\n\n` +
      `👤 *Cliente:* ${name}\n` +
      `📱 *WhatsApp:* ${phone}\n\n` +
      `🚙 *Tipo de Veículo:* ${vehicleLabel}\n` +
      `⚠️ *Situação:* ${conditionLabel}\n\n` +
      `📍 *Localização:*\n${location.address}\n` +
      `🗺️ *Região:* ${location.region}\n` +
      `📐 *Coordenadas:* ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n\n` +
      `🕐 *Horário:* ${getCurrentTime()}\n\n` +
      `🔗 *Ver no Mapa:*\nhttps://www.google.com/maps?q=${location.latitude},${location.longitude}`
    );

    const whatsappNumber = '5562991429264';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast.success('Redirecionando para o WhatsApp...');
    
    setName('');
    setPhone('');
    setSelectedVehicle(null);
    setSelectedCondition(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-card border-border p-0 animate-scale-in">
        {/* Header */}
        <div className="bg-primary p-5 text-primary-foreground sticky top-0 z-10">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-center">
              Solicitar Guincho
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 text-center text-sm">
              Preencha todos os dados abaixo
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-5 space-y-5">
          {/* Location */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Sua localização</p>
              <p className="text-sm font-medium truncate">
                {location.loading ? 'Buscando...' : location.error || location.region}
              </p>
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
            <label className="block text-sm font-medium mb-3">Que tipo de veículo é o seu? *</label>
            <div className="grid grid-cols-4 gap-2">
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
            <label className="block text-sm font-medium mb-3">O veículo está como? *</label>
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
            Enviar pelo WhatsApp
          </Button>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Atendimento 24h em toda região de SP
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestModal;
