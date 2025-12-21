import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageCircle, Send, MapPin, Users, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Provider {
  id: string;
  name: string;
  whatsapp: string;
  region: string | null;
}

interface WhatsAppBroadcastProps {
  providers: Provider[];
  className?: string;
}

const WhatsAppBroadcast: React.FC<WhatsAppBroadcastProps> = ({ providers, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');

  // Get unique regions
  const regions = useMemo(() => {
    const regionSet = new Set<string>();
    providers.forEach(p => {
      if (p.region) regionSet.add(p.region);
    });
    return Array.from(regionSet).sort();
  }, [providers]);

  // Filter providers by region
  const filteredProviders = useMemo(() => {
    if (selectedRegion === 'all') return providers;
    if (selectedRegion === 'sem_regiao') return providers.filter(p => !p.region);
    return providers.filter(p => p.region === selectedRegion);
  }, [providers, selectedRegion]);

  // Handle region change
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSelectedProviders(new Set());
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedProviders.size === filteredProviders.length) {
      setSelectedProviders(new Set());
    } else {
      setSelectedProviders(new Set(filteredProviders.map(p => p.id)));
    }
  };

  // Toggle single provider
  const toggleProvider = (id: string) => {
    const newSet = new Set(selectedProviders);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProviders(newSet);
  };

  // Format phone for WhatsApp
  const formatWhatsAppNumber = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    // Add Brazil country code if not present
    if (numbers.length === 11 || numbers.length === 10) {
      return `55${numbers}`;
    }
    return numbers;
  };

  // Send to selected providers
  const handleSend = () => {
    if (selectedProviders.size === 0) {
      toast({ title: 'Selecione pelo menos um prestador', variant: 'destructive' });
      return;
    }
    if (!message.trim()) {
      toast({ title: 'Digite uma mensagem', variant: 'destructive' });
      return;
    }

    const selectedList = filteredProviders.filter(p => selectedProviders.has(p.id));
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp for each provider
    selectedList.forEach((provider, index) => {
      const phone = formatWhatsAppNumber(provider.whatsapp);
      const url = `https://wa.me/${phone}?text=${encodedMessage}`;
      
      // Stagger opening to avoid popup blockers
      setTimeout(() => {
        window.open(url, '_blank');
      }, index * 500);
    });

    toast({ 
      title: `Abrindo WhatsApp para ${selectedList.length} prestador(es)`,
      description: 'As janelas serão abertas em sequência'
    });
  };

  // Open modal and reset state
  const openModal = () => {
    setIsOpen(true);
    setSelectedRegion('all');
    setSelectedProviders(new Set());
    setMessage('');
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={openModal}
        className={`border-green-600/50 text-green-400 hover:bg-green-600/20 ${className}`}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        WhatsApp
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-400" />
              Enviar WhatsApp por Região
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Selecione uma região e os prestadores para enviar mensagem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Region Filter */}
            <div>
              <Label className="text-slate-300 mb-2 block">Região</Label>
              <Select value={selectedRegion} onValueChange={handleRegionChange}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione uma região" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all" className="text-white">
                    Todas as regiões ({providers.length})
                  </SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region} className="text-white">
                      {region} ({providers.filter(p => p.region === region).length})
                    </SelectItem>
                  ))}
                  <SelectItem value="sem_regiao" className="text-white">
                    Sem região ({providers.filter(p => !p.region).length})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Providers List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Prestadores ({filteredProviders.length})
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="text-xs text-slate-400 hover:text-white h-7"
                >
                  {selectedProviders.size === filteredProviders.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>

              <div className="max-h-40 overflow-y-auto bg-slate-900/50 rounded-lg border border-slate-700 p-2 space-y-1">
                {filteredProviders.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    Nenhum prestador nesta região
                  </div>
                ) : (
                  filteredProviders.map(provider => (
                    <label
                      key={provider.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedProviders.has(provider.id)}
                        onCheckedChange={() => toggleProvider(provider.id)}
                        className="border-slate-500 data-[state=checked]:bg-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{provider.name}</div>
                        <div className="text-xs text-slate-500">{provider.whatsapp}</div>
                      </div>
                      {provider.region && (
                        <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                          {provider.region}
                        </Badge>
                      )}
                    </label>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {selectedProviders.size} selecionado(s)
                </Badge>
              </div>
            </div>

            {/* Message */}
            <div>
              <Label className="text-slate-300 mb-2 block">Mensagem</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite a mensagem que será enviada..."
                className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSend}
                disabled={selectedProviders.size === 0 || !message.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar ({selectedProviders.size})
              </Button>
            </div>

            <p className="text-[10px] text-slate-500 text-center">
              Cada prestador abrirá em uma nova aba do WhatsApp Web
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WhatsAppBroadcast;