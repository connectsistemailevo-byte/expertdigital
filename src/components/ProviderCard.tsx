import React from 'react';
import { Provider } from '@/hooks/useProviders';
import { MapPin, Clock, Truck, CheckCircle } from 'lucide-react';

interface ProviderCardProps {
  provider: Provider;
  isSelected: boolean;
  onSelect: () => void;
}

const serviceLabels: Record<string, string> = {
  moto: 'Moto',
  carro_popular: 'Carro Popular',
  sedan: 'Sedan',
  suv: 'SUV',
  utilitarios_pesados: 'Utilitários Pesados',
  guincho_completo: 'Completo',
};

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
        isSelected
          ? 'border-secondary bg-secondary/10'
          : 'border-border hover:border-secondary/50 hover:bg-muted'
      }`}
    >
      {isSelected && (
        <CheckCircle className="w-5 h-5 text-secondary absolute top-3 right-3" />
      )}
      
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
          isSelected ? 'bg-secondary text-secondary-foreground' : 'bg-muted'
        }`}>
          <Truck className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{provider.name}</h4>
          
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{provider.distance?.toFixed(1)} km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>~{provider.estimatedTime} min</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {provider.has_patins && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                Com Patins
              </span>
            )}
            {provider.service_types.slice(0, 2).map(type => (
              <span 
                key={type}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground"
              >
                {serviceLabels[type] || type}
              </span>
            ))}
            {provider.service_types.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                +{provider.service_types.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default ProviderCard;
