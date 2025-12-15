import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, CheckCircle2, ArrowRight, Share, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PROVIDER_STORAGE_KEY = 'showtime_provider_data';

const InstalarPWA: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Try to get from URL first, then from localStorage
  const urlProviderId = searchParams.get('id');
  const urlProviderName = searchParams.get('name');
  
  const storedData = localStorage.getItem(PROVIDER_STORAGE_KEY);
  const parsedData = storedData ? JSON.parse(storedData) : null;
  
  const providerId = urlProviderId || parsedData?.id || null;
  const providerName = urlProviderName || parsedData?.name || 'Prestador';

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Save provider data to localStorage when available from URL
  useEffect(() => {
    if (urlProviderId) {
      localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify({
        id: urlProviderId,
        name: urlProviderName || 'Prestador'
      }));
    }
  }, [urlProviderId, urlProviderName]);

  useEffect(() => {
    // Check if already in standalone mode (PWA installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect device
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const goToTracking = () => {
    navigate(`/rastreamento?id=${providerId}&name=${encodeURIComponent(providerName)}`);
  };

  // If already in standalone mode, redirect to tracking
  if (isStandalone && providerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-sm w-full text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <h1 className="text-2xl font-bold text-white mb-2">App Instalado!</h1>
          <p className="text-white/70 mb-6">Você está usando o app ShowTime.</p>
          <Button 
            onClick={goToTracking}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Iniciar Rastreamento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Instalar App</h1>
          <p className="text-green-400 font-medium">{decodeURIComponent(providerName)}</p>
        </div>

        {/* Benefits */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-orange-400" />
            Por que instalar?
          </h2>
          <ul className="space-y-2 text-white/80 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Rastreamento GPS confiável e contínuo</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Funciona em segundo plano</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Acesso rápido na tela inicial</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Mantém você online mesmo minimizado</span>
            </li>
          </ul>
        </div>

        {/* Install Instructions */}
        {isInstalled ? (
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="text-green-400 font-bold mb-4">App instalado com sucesso!</p>
            <Button 
              onClick={goToTracking}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Iniciar Rastreamento
            </Button>
          </div>
        ) : deferredPrompt ? (
          <Button 
            onClick={handleInstallClick}
            className="w-full bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Instalar Agora
          </Button>
        ) : isIOS ? (
          <div className="space-y-4">
            <p className="text-white text-center font-medium">Como instalar no iPhone:</p>
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">1</div>
                <div className="flex-1 text-white/80 text-sm flex items-center gap-2">
                  Toque em <Share className="w-5 h-5 text-blue-400" /> (Compartilhar)
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">2</div>
                <div className="flex-1 text-white/80 text-sm">
                  Role para baixo e toque em "Adicionar à Tela de Início"
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">3</div>
                <div className="flex-1 text-white/80 text-sm">
                  Toque em "Adicionar"
                </div>
              </div>
            </div>
          </div>
        ) : isAndroid ? (
          <div className="space-y-4">
            <p className="text-white text-center font-medium">Como instalar no Android:</p>
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">1</div>
                <div className="flex-1 text-white/80 text-sm flex items-center gap-2">
                  Toque em <MoreVertical className="w-5 h-5 text-green-400" /> (menu)
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">2</div>
                <div className="flex-1 text-white/80 text-sm">
                  Toque em "Instalar app" ou "Adicionar à tela inicial"
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">3</div>
                <div className="flex-1 text-white/80 text-sm">
                  Confirme a instalação
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-white/70 mb-4">Seu navegador suporta instalação de apps.</p>
            <p className="text-white/50 text-sm">Aguarde o prompt de instalação aparecer...</p>
          </div>
        )}

        {/* Skip option */}
        {!isInstalled && (
          <button 
            onClick={goToTracking}
            className="w-full mt-4 text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            Pular e usar no navegador →
          </button>
        )}
      </div>
    </div>
  );
};

export default InstalarPWA;
