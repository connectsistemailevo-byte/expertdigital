import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Navigation, CheckCircle2, ExternalLink } from 'lucide-react';
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
  const [trackingWindow, setTrackingWindow] = useState<Window | null>(null);

  // Check if tracking window is still open
  useEffect(() => {
    if (!trackingWindow) return;

    const checkWindow = setInterval(() => {
      if (trackingWindow.closed) {
        setIsTracking(false);
        setTrackingWindow(null);
        toast.info('Rastreamento desativado', {
          description: 'A janela de rastreamento foi fechada.',
        });
      }
    }, 1000);

    return () => clearInterval(checkWindow);
  }, [trackingWindow]);

  const handleActivateTracking = () => {
    // Build the tracking URL with provider info
    const trackingUrl = `/tracking?id=${encodeURIComponent(providerId)}&name=${encodeURIComponent(providerName)}`;
    
    // Open in a new window/tab
    const newWindow = window.open(
      trackingUrl,
      'providerTracking',
      'width=400,height=600,resizable=yes,scrollbars=yes'
    );

    if (newWindow) {
      setTrackingWindow(newWindow);
      setIsTracking(true);
      toast.success('Janela de rastreamento aberta!', {
        description: 'Permita o acesso à localização na nova janela.',
      });
    } else {
      // If popup was blocked, try opening in same tab
      toast.info('Abrindo rastreamento...', {
        description: 'Caso não abra automaticamente, desative o bloqueador de popups.',
      });
      window.location.href = trackingUrl;
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
      {isTracking ? (
        <>
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Rastreamento Ativo
        </>
      ) : (
        <>
          <Navigation className="w-5 h-5 mr-2" />
          Ativar Rastreamento
          <ExternalLink className="w-4 h-4 ml-2" />
        </>
      )}
    </Button>
  );
};

export default ProviderTrackingButton;
