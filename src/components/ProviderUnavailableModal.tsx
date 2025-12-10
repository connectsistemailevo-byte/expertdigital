import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface ProviderUnavailableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerName: string;
}

export function ProviderUnavailableModal({
  open,
  onOpenChange,
  providerName,
}: ProviderUnavailableModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
          <DialogTitle className="text-xl text-white">
            Prestador Indisponível
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            O prestador <strong className="text-white">{providerName}</strong> não está disponível no momento. 
            Por favor, escolha outro prestador da lista para continuar com sua solicitação.
          </DialogDescription>
        </DialogHeader>

        <Button
          className="w-full bg-gradient-to-r from-primary to-purple-600"
          onClick={() => onOpenChange(false)}
        >
          Escolher Outro Prestador
        </Button>
      </DialogContent>
    </Dialog>
  );
}
