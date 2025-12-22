import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Check, MessageCircle, Truck, QrCode, Smartphone, Shield } from 'lucide-react';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-yellow-500/30 max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Truck className="w-8 h-8 text-black" />
          </div>
          <DialogTitle className="text-2xl text-white">
            Ative seu App Exclusivo
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Tenha um app exclusivo para seus clientes. Pagamento único, sem mensalidade.
          </DialogDescription>
        </DialogHeader>

        <div className="text-center my-4">
          <div className="text-5xl font-bold text-yellow-400 mb-2">R$ 47</div>
          <p className="text-slate-400 text-sm">Pagamento único • Sem mensalidade</p>
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
            <span className="text-sm">Sem limite de atendimentos</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <QrCode className="w-5 h-5 text-yellow-400 shrink-0" />
            <span className="text-sm">QR Code exclusivo do seu guincho</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <Smartphone className="w-5 h-5 text-yellow-400 shrink-0" />
            <span className="text-sm">App exclusivo com seu nome</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <Shield className="w-5 h-5 text-yellow-400 shrink-0" />
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
