import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';
import { Car, Truck, Bike, MapPin, Clock, AlertTriangle, Fuel, RotateCcw, Building2, CheckCircle2 } from 'lucide-react';
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
  const { location } = useLocation();
  const [step, setStep] = useState(1);
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

  const handleSubmit = () => {
    if (!name || !phone || !selectedVehicle || !selectedCondition) {
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
      `🕐 *Horário da Solicitação:* ${getCurrentTime()}\n\n` +
      `🔗 *Ver no Mapa:*\nhttps://www.google.com/maps?q=${location.latitude},${location.longitude}`
    );

    const whatsappNumber = '5562991429264';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast.success('Solicitação enviada! Você será redirecionado para o WhatsApp.');
    
    // Reset form
    setStep(1);
    setName('');
    setPhone('');
    setSelectedVehicle(null);
    setSelectedCondition(null);
    onOpenChange(false);
  };

  const canProceedStep1 = name.length >= 2 && phone.length >= 14;
  const canProceedStep2 = selectedVehicle !== null;
  const canSubmit = selectedCondition !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 overflow-hidden animate-scale-in">
        {/* Header with gradient */}
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-center">
              Solicitar Guincho
            </DialogTitle>
            <p className="text-primary-foreground/80 text-center text-sm mt-2">
              Preencha os dados para solicitar um guincho
            </p>
          </DialogHeader>
          
          {/* Progress indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-secondary' : 'bg-primary-foreground/20'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Location info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-6">
            <MapPin className="w-5 h-5 text-secondary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Sua localização</p>
              <p className="text-sm font-medium truncate">{location.region}</p>
            </div>
            {location.loading && (
              <div className="ml-auto">
                <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium mb-2">Seu nome</label>
                <Input
                  placeholder="Digite seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={15}
                  className="h-12"
                />
              </div>
              <Button
                variant="hero"
                size="lg"
                className="w-full mt-4"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                Continuar
              </Button>
            </div>
          )}

          {/* Step 2: Vehicle Type */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-semibold text-lg text-center mb-4">
                Qual é o tipo do seu veículo?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {vehicleTypes.map((vehicle) => {
                  const Icon = vehicle.icon;
                  const isSelected = selectedVehicle === vehicle.id;
                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                        isSelected
                          ? 'border-secondary bg-secondary/10 scale-105'
                          : 'border-border hover:border-secondary/50 hover:bg-muted'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-secondary text-secondary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-medium text-sm">{vehicle.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-secondary absolute top-2 right-2" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  className="flex-1"
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Vehicle Condition */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-display font-semibold text-lg text-center mb-4">
                O veículo está como?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {vehicleConditions.map((condition) => {
                  const Icon = condition.icon;
                  const isSelected = selectedCondition === condition.id;
                  return (
                    <button
                      key={condition.id}
                      onClick={() => setSelectedCondition(condition.id)}
                      className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 ${
                        isSelected
                          ? 'border-secondary bg-secondary/10 scale-105'
                          : 'border-border hover:border-secondary/50 hover:bg-muted'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-muted`}>
                        <Icon className={`w-6 h-6 ${condition.color}`} />
                      </div>
                      <span className="font-medium text-sm text-center">{condition.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-secondary absolute top-2 right-2" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Voltar
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  className="flex-1"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  Enviar pelo WhatsApp
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Atendimento 24 horas em toda região de SP
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestModal;
