import React from 'react';
import { Provider } from '@/hooks/useProviders';
import { MapPin, Clock, Truck, CheckCircle, DollarSign } from 'lucide-react';

interface ProviderCardProps {
  provider: Provider;
  isSelected: boolean;
  onSelect: () => void;
  needsPatins?: boolean;
}

const serviceLabels: Record<string, string> = {
  moto: 'Moto',
  carro_popular: 'Carro Popular',
  sedan: 'Sedan',
  suv: 'SUV',
  utilitarios_pesados: 'Utilitários Pesados',
  guincho_completo: 'Completo',
};

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, isSelected, onSelect, needsPatins = false }) => {
  const calculateTotalPrice = () => {
    let total = provider.estimatedPrice || 0;
    if (needsPatins && provider.has_patins) {
      total += provider.patins_extra_price || 30;
    }
    return total;
  };

  const totalPrice = calculateTotalPrice();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full p-3 rounded-xl border-2 transition-all duration-200 text-left ${
        isSelected
          ? 'border-secondary bg-secondary/10'
          : 'border-border hover:border-secondary/50 hover:bg-muted'
      }`}
    >
      {isSelected && (
        <CheckCircle className="w-4 h-4 text-secondary absolute top-2 right-2" />
      )}
      
      <div className="flex items-start gap-2">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isSelected ? 'bg-secondary text-secondary-foreground' : 'bg-muted'
        }`}>
          <Truck className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{provider.name}</h4>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{provider.distance?.toFixed(1)} km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>~{provider.estimatedTime} min</span>
            </div>
          </div>
          
          {/* Price Display */}
          <div className="flex items-center gap-1 mt-1">
            <DollarSign className="w-3 h-3 text-green-500" />
            <span className="text-sm font-bold text-green-600">
              R$ {totalPrice.toFixed(2)}
            </span>
            {needsPatins && provider.has_patins && (
              <span className="text-[10px] text-muted-foreground">(com patins)</span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1 mt-1">
            {provider.has_patins && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                Patins
              </span>
            )}
            {provider.service_types.slice(0, 2).map(type => (
              <span 
                key={type}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground"
              >
                {serviceLabels[type] || type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
};

export default ProviderCard;