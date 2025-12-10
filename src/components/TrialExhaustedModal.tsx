import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { PlanSelectionModal } from './PlanSelectionModal';
import { useState } from 'react';
import { Button } from './ui/button';

interface TrialExhaustedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  whatsapp: string;
  reason?: 'trial_exhausted' | 'limit_reached' | 'no_plan';
  message?: string;
}

export function TrialExhaustedModal({
  open,
  onOpenChange,
  providerId,
  whatsapp,
  reason = 'trial_exhausted',
  message,
}: TrialExhaustedModalProps) {
  const [showPlanModal, setShowPlanModal] = useState(false);

  const titles = {
    trial_exhausted: 'Período de Teste Encerrado',
    limit_reached: 'Limite de Corridas Atingido',
    no_plan: 'Escolha um Plano',
  };

  const descriptions = {
    trial_exhausted: 'Suas 10 corridas gratuitas acabaram. Para continuar usando o sistema, escolha um dos nossos planos.',
    limit_reached: message || 'Você atingiu o limite de corridas do seu plano atual.',
    no_plan: 'Para continuar usando o sistema, você precisa escolher um plano.',
  };

  return (
    <>
      <Dialog open={open && !showPlanModal} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <DialogTitle className="text-xl text-white">
              {titles[reason]}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {descriptions[reason]}
            </DialogDescription>
          </DialogHeader>

          <Button
            className="w-full bg-gradient-to-r from-primary to-purple-600"
            onClick={() => setShowPlanModal(true)}
          >
            Ver Planos Disponíveis
          </Button>
        </DialogContent>
      </Dialog>

      <PlanSelectionModal
        open={showPlanModal}
        onOpenChange={(open) => {
          setShowPlanModal(open);
          if (!open) onOpenChange(false);
        }}
        providerId={providerId}
        whatsapp={whatsapp}
      />
    </>
  );
}
