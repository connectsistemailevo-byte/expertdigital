import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  Zap, 
  MapPin, 
  Phone, 
  ExternalLink,
  Eye,
  Play,
  Pause,
  Settings,
  Edit,
  Trash2,
  RotateCcw,
  Ban
} from 'lucide-react';

interface ProviderSubscription {
  id: string;
  plano: 'basico' | 'profissional' | 'pro' | null;
  adesao_paga: boolean;
  trial_ativo: boolean;
  trial_corridas_restantes: number;
  corridas_usadas: number;
  limite_corridas: number;
  mensalidade_atual: number;
}

interface Provider {
  id: string;
  name: string;
  whatsapp: string;
  slug: string | null;
  region: string | null;
  address?: string | null;
  created_at?: string;
  provider_subscriptions: ProviderSubscription[] | null;
}

interface ProviderLocation {
  provider_id: string;
  is_online: boolean;
}

interface ProviderCardsProps {
  providers: Provider[];
  providerLocations: ProviderLocation[];
  onFocusProvider?: (providerId: string) => void;
  onEditProvider?: (provider: Provider) => void;
  onDeleteProvider?: (provider: Provider) => void;
  onToggleTrial?: (providerId: string) => void;
  onSetRides?: (provider: Provider) => void;
  onActivatePlan?: (provider: Provider) => void;
  onResetRides?: (providerId: string) => void;
  onDeactivatePlan?: (providerId: string) => void;
  actionLoading?: string | null;
}

const ProviderCards: React.FC<ProviderCardsProps> = ({
  providers,
  providerLocations,
  onFocusProvider,
  onEditProvider,
  onDeleteProvider,
  onToggleTrial,
  onSetRides,
  onActivatePlan,
  onResetRides,
  onDeactivatePlan,
  actionLoading
}) => {
  const getSubscription = (provider: Provider) => {
    return provider.provider_subscriptions?.[0] || null;
  };

  const isOnline = (providerId: string) => {
    return providerLocations.some(l => l.provider_id === providerId && l.is_online);
  };

  // Separate providers by status
  const paidProviders = providers.filter(p => getSubscription(p)?.adesao_paga);
  const trialProviders = providers.filter(p => getSubscription(p)?.trial_ativo && !getSubscription(p)?.adesao_paga);
  const blockedProviders = providers.filter(p => !getSubscription(p)?.trial_ativo && !getSubscription(p)?.adesao_paga);

  const renderProviderCard = (provider: Provider, colorScheme: 'green' | 'yellow' | 'red') => {
    const sub = getSubscription(provider);
    const online = isOnline(provider.id);
    const isLoading = actionLoading === provider.id;
    
    const colors = {
      green: {
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        accent: 'text-green-400',
        badge: 'bg-green-500/20 text-green-400'
      },
      yellow: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        accent: 'text-yellow-400',
        badge: 'bg-yellow-500/20 text-yellow-400'
      },
      red: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        accent: 'text-red-400',
        badge: 'bg-red-500/20 text-red-400'
      }
    };

    const c = colors[colorScheme];

    return (
      <div
        key={provider.id}
        className={`p-3 rounded-lg border ${c.bg} ${c.border} transition-all hover:border-opacity-50`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => onFocusProvider?.(provider.id)}
              className={`flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity`}
              title="Ver no mapa"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${online ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-white font-medium text-sm truncate">
                {provider.name}
              </span>
              {online && <Eye className="w-3 h-3 text-green-400 flex-shrink-0" />}
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            {sub?.adesao_paga && (
              <Badge className={`${c.badge} text-[9px] px-1.5 py-0`}>
                {sub.plano?.toUpperCase()}
              </Badge>
            )}
            {sub?.trial_ativo && !sub?.adesao_paga && (
              <Badge className={`${c.badge} text-[9px] px-1.5 py-0`}>
                Trial: {sub.trial_corridas_restantes}
              </Badge>
            )}
            {!sub?.trial_ativo && !sub?.adesao_paga && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                Bloq
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
          <span className="flex items-center gap-1">
            <Phone className="w-2.5 h-2.5" />
            {provider.whatsapp}
          </span>
          {provider.region && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-2.5 h-2.5" />
              {provider.region.split(',')[0]}
            </span>
          )}
        </div>

        {provider.slug && (
          <a
            href={`https://akiguincho24hs.lovable.app/p/${provider.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 mb-2"
          >
            /p/{provider.slug}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}

        {/* Rides info */}
        {sub && (
          <div className="text-[10px] text-slate-500 mb-2">
            {sub.adesao_paga ? (
              <span>
                Corridas: {sub.corridas_usadas}
                {sub.limite_corridas !== -1 ? `/${sub.limite_corridas}` : ' (∞)'}
              </span>
            ) : sub.trial_ativo ? (
              <span className={sub.trial_corridas_restantes <= 3 ? 'text-amber-400' : ''}>
                {sub.trial_corridas_restantes} corridas restantes
              </span>
            ) : null}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-slate-400 hover:text-white"
            onClick={() => onToggleTrial?.(provider.id)}
            disabled={isLoading}
            title={sub?.trial_ativo ? 'Pausar Trial' : 'Ativar Trial'}
          >
            {sub?.trial_ativo ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-slate-400 hover:text-white"
            onClick={() => onSetRides?.(provider)}
            disabled={isLoading}
            title="Definir Corridas"
          >
            <Settings className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-green-400 hover:text-green-300"
            onClick={() => onActivatePlan?.(provider)}
            disabled={isLoading}
            title="Ativar Plano"
          >
            <Crown className="w-3 h-3" />
          </Button>

          {sub?.adesao_paga && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-blue-400 hover:text-blue-300"
                onClick={() => onResetRides?.(provider.id)}
                disabled={isLoading}
                title="Zerar Corridas"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-red-400 hover:text-red-300"
                onClick={() => onDeactivatePlan?.(provider.id)}
                disabled={isLoading}
                title="Desativar Plano"
              >
                <Ban className="w-3 h-3" />
              </Button>
            </>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-purple-400 hover:text-purple-300"
            onClick={() => onEditProvider?.(provider)}
            disabled={isLoading}
            title="Editar"
          >
            <Edit className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-red-500 hover:text-red-400"
            onClick={() => onDeleteProvider?.(provider)}
            disabled={isLoading}
            title="Excluir"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Paid Providers */}
      {paidProviders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold text-green-400 uppercase">
              Plano Ativo ({paidProviders.length})
            </span>
          </div>
          <div className="grid gap-2">
            {paidProviders.map(p => renderProviderCard(p, 'green'))}
          </div>
        </div>
      )}

      {/* Trial Providers */}
      {trialProviders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 uppercase">
              Em Trial ({trialProviders.length})
            </span>
          </div>
          <div className="grid gap-2">
            {trialProviders.map(p => renderProviderCard(p, 'yellow'))}
          </div>
        </div>
      )}

      {/* Blocked Providers */}
      {blockedProviders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Ban className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold text-red-400 uppercase">
              Bloqueados ({blockedProviders.length})
            </span>
          </div>
          <div className="grid gap-2">
            {blockedProviders.map(p => renderProviderCard(p, 'red'))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderCards;