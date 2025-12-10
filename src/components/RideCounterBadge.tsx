import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap, Gift } from 'lucide-react';

interface RideCounterBadgeProps {
  trialAtivo: boolean;
  trialCorridasRestantes: number;
  adesaoPaga: boolean;
  corridasUsadas: number;
  limiteCorreidas: number;
  plano: string | null;
  compact?: boolean;
}

export function RideCounterBadge({
  trialAtivo,
  trialCorridasRestantes,
  adesaoPaga,
  corridasUsadas,
  limiteCorreidas,
  plano,
  compact = false,
}: RideCounterBadgeProps) {
  // Trial ativo
  if (trialAtivo && !adesaoPaga) {
    const isLow = trialCorridasRestantes <= 3;
    const isExhausted = trialCorridasRestantes <= 0;

    if (isExhausted) {
      return (
        <Badge 
          variant="destructive" 
          className="animate-pulse flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3" />
          {compact ? '0' : 'Trial esgotado'}
        </Badge>
      );
    }

    if (isLow) {
      return (
        <Badge 
          className="bg-orange-500/20 text-orange-400 border-orange-500 animate-pulse flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3" />
          {compact ? trialCorridasRestantes : `Apenas ${trialCorridasRestantes} corridas restantes!`}
        </Badge>
      );
    }

    return (
      <Badge 
        className="bg-yellow-500/20 text-yellow-400 border-yellow-500 flex items-center gap-1"
      >
        <Gift className="w-3 h-3" />
        {compact ? trialCorridasRestantes : `Trial: ${trialCorridasRestantes} corridas`}
      </Badge>
    );
  }

  // Plano pago
  if (adesaoPaga && plano) {
    // PRO = ilimitado
    if (plano === 'pro') {
      return (
        <Badge 
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center gap-1"
        >
          <Zap className="w-3 h-3" />
          {compact ? '∞' : 'Corridas ilimitadas'}
        </Badge>
      );
    }

    // Planos com limite
    const remaining = limiteCorreidas - corridasUsadas;
    const percentUsed = (corridasUsadas / limiteCorreidas) * 100;
    const isLow = remaining <= 3;
    const isExhausted = remaining <= 0;

    if (isExhausted) {
      return (
        <Badge 
          variant="destructive" 
          className="animate-pulse flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3" />
          {compact ? '0' : 'Limite atingido'}
        </Badge>
      );
    }

    if (isLow) {
      return (
        <Badge 
          className="bg-orange-500/20 text-orange-400 border-orange-500 animate-pulse flex items-center gap-1"
        >
          <AlertTriangle className="w-3 h-3" />
          {compact ? remaining : `Apenas ${remaining} corridas restantes!`}
        </Badge>
      );
    }

    // Normal
    const planColors = {
      basico: 'bg-blue-500/20 text-blue-400 border-blue-500',
      profissional: 'bg-green-500/20 text-green-400 border-green-500',
    };

    return (
      <Badge 
        className={`${planColors[plano as keyof typeof planColors] || ''} flex items-center gap-1`}
      >
        {compact ? `${corridasUsadas}/${limiteCorreidas}` : `${corridasUsadas}/${limiteCorreidas} corridas`}
      </Badge>
    );
  }

  // Sem plano
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {compact ? '-' : 'Sem plano ativo'}
    </Badge>
  );
}
