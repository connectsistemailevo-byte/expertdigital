import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle, Check, MessageCircle } from 'lucide-react';
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

  const handleWhatsAppRedirect = () => {
    const msg = encodeURIComponent("Olá! Quero ativar meu app exclusivo de guincho por R$ 47,00");
    window.open(`https://wa.me/5562994389675?text=${msg}`, '_blank');
  };

  const titles = {
    trial_exhausted: 'Ative seu App Exclusivo',
    limit_reached: 'Ative seu App Exclusivo',
    no_plan: 'Ative seu App Exclusivo',
  };

  const descriptions = {
    trial_exhausted: 'Tenha um app exclusivo para seus clientes com pagamento único.',
    limit_reached: 'Tenha um app exclusivo para seus clientes com pagamento único.',
    no_plan: 'Tenha um app exclusivo para seus clientes com pagamento único.',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
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

        <div className="text-center my-4">
          <div className="text-5xl font-bold text-yellow-400 mb-2">R$ 47</div>
          <p className="text-slate-500 text-sm">Pagamento único</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-white">
            <Check className="w-5 h-5 text-yellow-400 shrink-0" />
            <span className="text-sm">Sem mensalidade</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <Check className="w-5 h-5 text-yellow-400 shrink-0" />
            <span className="text-sm">Sem comissão por chamado</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <Check className="w-5 h-5 text-yellow-400 shrink-0" />
            <span className="text-sm">App exclusivo com seu nome</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <Check className="w-5 h-5 text-yellow-400 shrink-0" />
            <span className="text-sm">QR Code personalizado</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <Check className="w-5 h-5 text-yellow-400 shrink-0" />
            <span className="text-sm">Funciona 24 horas</span>
          </div>
        </div>

        <Button
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-6"
          onClick={handleWhatsAppRedirect}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Ativar por R$ 47,00
        </Button>
      </DialogContent>
    </Dialog>
  );
}
