import React from 'react';
import { Provider } from '@/hooks/useProviders';
import { MapPin, Clock, Truck, CheckCircle, DollarSign, Route } from 'lucide-react';
interface ProviderCardProps {
  provider: Provider;
  isSelected: boolean;
  onSelect: () => void;
  needsPatins?: boolean;
  tripDistanceKm?: number; // Distance from client location to destination
  className?: string;
}
const serviceLabels: Record<string, string> = {
  moto: 'Moto',
  carro_popular: 'Carro Popular',
  sedan: 'Sedan',
  suv: 'SUV',
  utilitarios_pesados: 'Utilitários Pesados',
  guincho_completo: 'Completo'
};
const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  isSelected,
  onSelect,
  needsPatins = false,
  tripDistanceKm,
  className
}) => {
  // Calculate price based on trip distance (client → destination), not provider distance
  const calculateTripPrice = () => {
    const basePrice = provider.base_price || 50;
    const pricePerKm = provider.price_per_km || 5;
    const distance = tripDistanceKm || 0;
    let total = basePrice + distance * pricePerKm;
    if (needsPatins && provider.has_patins) {
      total += provider.patins_extra_price || 30;
    }
    return total;
  };
  const tripPrice = calculateTripPrice();
  const hasValidTripDistance = tripDistanceKm && tripDistanceKm > 0;
  return <button type="button" onClick={onSelect} className={`relative w-full p-3 rounded-xl border-2 transition-all duration-200 text-left ${isSelected ? 'border-secondary bg-secondary/10' : 'border-border hover:border-secondary/50 hover:bg-muted'} ${className || ''}`}>
      {isSelected && <CheckCircle className="w-4 h-4 text-secondary absolute top-2 right-2" />}
      
      <div className="flex items-start gap-2 text-secondary-foreground">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-secondary text-secondary-foreground' : 'bg-muted'}`}>
          <Truck className="w-5 h-5 bg-primary text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-sm truncate text-current">{provider.name}</h4>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] px-1 py-0.5 rounded bg-green-300 text-secondary-foreground">
                R${provider.base_price?.toFixed(0) || 50} + R${provider.price_per_km?.toFixed(2) || '5.00'}/km
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-sidebar-accent bg-[sidebar-accent-foreground] text-teal-800">
                Disponível
              </span>
            </div>
          </div>
          
          {/* Provider distance (how far provider is from client) */}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-foreground" />
              <span className="text-secondary-foreground">{provider.distance?.toFixed(1)} km de você</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary" />
              <span className="text-secondary-foreground">~{provider.estimatedTime} min</span>
            </div>
          </div>
          
          {/* Trip distance and price - only show if destination is set */}
          {hasValidTripDistance ? <div className="flex items-center gap-3 mt-1.5 p-1.5 bg-green-50 dark:bg-green-950/30 rounded-md">
              <div className="flex items-center gap-1">
                <Route className="w-3 h-3 text-green-600" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  Trajeto: {tripDistanceKm.toFixed(1)} km
                </span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-green-600" />
                <span className="text-sm font-bold text-green-700 dark:text-green-400">
                  R$ {tripPrice.toFixed(2)}
                </span>
              </div>
            </div> : <div className="flex items-center gap-1 mt-1.5 p-1.5 rounded-md bg-primary-foreground">
              <Route className="w-3 h-3 text-green-600" />
              <span className="text-[10px] font-bold text-secondary-foreground">
                Informe o destino para ver o valor
              </span>
            </div>}

          {needsPatins && provider.has_patins && hasValidTripDistance && <p className="text-[10px] text-muted-foreground mt-0.5">
              (inclui R$ {(provider.patins_extra_price || 30).toFixed(2)} de patins)
            </p>}
          
          <div className="flex flex-wrap gap-1 mt-1.5">
            {provider.has_patins && <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-secondary-foreground bg-secondary">
                Patins
              </span>}
            {provider.service_types.slice(0, 2).map(type => <span key={type} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-secondary-foreground bg-secondary">
                {serviceLabels[type] || type}
              </span>)}
          </div>
        </div>
      </div>
    </button>;
};
export default ProviderCard;