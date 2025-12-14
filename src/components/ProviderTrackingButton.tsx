import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProviderTrackingButtonProps {
  providerId: string;
  providerName: string;
}

const ProviderTrackingButton: React.FC<ProviderTrackingButtonProps> = ({ 
  providerId,
  providerName 
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
  const trackingTabRef = useRef<Window | null>(null);

  // Check if tracking tab is still open
  useEffect(() => {
    if (!trackingTabRef.current) return;

    const checkTab = setInterval(() => {
      if (trackingTabRef.current?.closed) {
        setIsTracking(false);
        trackingTabRef.current = null;
        setStatus('idle');
        toast.info('Rastreamento desativado', {
          description: 'A aba de rastreamento foi fechada.',
        });
      }
    }, 2000);

    return () => clearInterval(checkTab);
  }, [isTracking]);

  const handleActivateTracking = () => {
    setStatus('requesting');
    
    // Build the tracking URL using the current origin
    const trackingUrl = `${window.location.origin}/tracking?id=${encodeURIComponent(providerId)}&name=${encodeURIComponent(providerName)}`;
    
    // Open in new tab (works better on mobile than popup)
    const newTab = window.open(trackingUrl, '_blank');
    
    if (newTab) {
      trackingTabRef.current = newTab;
      setIsTracking(true);
      setStatus('active');
      toast.success('Rastreamento iniciado!', {
        description: 'Permita a localização na nova aba que abriu.',
      });
    } else {
      // If popup blocked, open in same tab
      setStatus('error');
      toast.error('Não foi possível abrir nova aba', {
        description: 'Redirecionando...',
      });
      // Fallback: redirect in same window
      setTimeout(() => {
        window.location.href = trackingUrl;
      }, 1500);
    }
  };

  return (
    <Button
      onClick={handleActivateTracking}
      disabled={isTracking}
      className={`w-full ${
        isTracking 
          ? 'bg-green-600 hover:bg-green-600 cursor-default' 
          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
      }`}
      size="lg"
    >
      {status === 'requesting' ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Abrindo...
        </>
      ) : isTracking ? (
        <>
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Rastreamento Ativo
        </>
      ) : status === 'error' ? (
        <>
          <XCircle className="w-5 h-5 mr-2" />
          Tentar Novamente
        </>
      ) : (
        <>
          <Navigation className="w-5 h-5 mr-2" />
          Ativar Rastreamento
        </>
      )}
    </Button>
  );
};

export default ProviderTrackingButton;
