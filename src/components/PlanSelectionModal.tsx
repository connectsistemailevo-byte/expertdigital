import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import LiveTrackingMap from './LiveTrackingMap';

interface PlanSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  whatsapp: string;
  trialCorridasRestantes?: number;
  showTrial?: boolean;
}

const PLANS = [
  {
    id: 'basico',
    name: 'Plano Essencial',
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    adesao: 79,
    mensalidade: 37,
    limiteCorreidas: 30,
    beneficios: [
      'Acesso completo à plataforma',
      'Funcionalidades essenciais',
      'Suporte de qualidade',
      'Sistema leve (economiza bateria)',
      'Sem taxa por solicitação',
      'Autonomia para aprovar chamados',
      'Solicitações direto no WhatsApp',
      'Localização, distância e tempo em tempo real',
    ],
  },
  {
    id: 'profissional',
    name: 'Plano Profissional',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500',
    adesao: 139,
    mensalidade: 47,
    limiteCorreidas: 50,
    popular: true,
    beneficios: [
      'Acesso completo à plataforma',
      'Personalização com sua logo + domínio',
      'Painel profissional e suporte avançado',
      'Sistema mais leve e otimizado',
      'Sem taxa por solicitação',
      'Autonomia total: controle de chamadas e preços',
      'Chamados diretos no WhatsApp + atualizações',
      'Localização exata, KM, destino e tempo estimado',
    ],
  },
];

export function PlanSelectionModal({
  open,
  onOpenChange,
  providerId,
  whatsapp,
  trialCorridasRestantes = 0,
  showTrial = false,
}: PlanSelectionModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setLoading(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-provider-checkout', {
        body: {
          provider_id: providerId,
          plano: planId,
          whatsapp,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast({
        title: 'Erro ao iniciar pagamento',
        description: err.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl md:text-3xl font-bold text-white">
            Escolha seu Plano
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {showTrial && trialCorridasRestantes > 0 ? (
              <span className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500">
                  Trial: {trialCorridasRestantes} corridas restantes
                </Badge>
              </span>
            ) : (
              'Selecione o plano ideal para o seu negócio'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Mapa de Rastreamento */}
        <div className="rounded-xl overflow-hidden border border-white/10 mb-6">
          <div className="h-[200px] md:h-[250px]">
            <LiveTrackingMap />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 py-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 ${plan.borderColor} bg-slate-800/50 p-5 transition-all hover:scale-105 hover:shadow-xl ${
                  plan.popular ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white">
                    Mais Popular
                  </Badge>
                )}

                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>

                <div className="space-y-1 mb-4">
                  <p className="text-slate-400 text-sm">
                    💳 Adesão:{' '}
                    <span className="text-white font-semibold">R$ {plan.adesao.toFixed(2)}</span>
                  </p>
                  <p className="text-slate-400 text-sm">
                    📅 Mensalidade:{' '}
                    <span className="text-2xl text-white font-bold">
                      R$ {plan.mensalidade.toFixed(2)}
                    </span>
                    <span className="text-slate-500">/mês</span>
                  </p>
                  <p className="text-slate-400 text-sm">
                    🚗 Limite: <span className="text-white">{plan.limiteCorreidas} corridas/mês</span>
                  </p>
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.beneficios.map((beneficio, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {beneficio}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90`}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading !== null}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Escolher Plano'
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {showTrial && trialCorridasRestantes > 0 && (
          <p className="text-center text-slate-500 text-sm pt-2">
            Você ainda tem {trialCorridasRestantes} corridas gratuitas. O pagamento será necessário quando acabarem.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
