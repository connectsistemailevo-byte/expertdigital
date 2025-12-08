import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from '@/contexts/LocationContext';
import Map from '@/components/Map';
import RequestModal from '@/components/RequestModal';
import ProviderRegistrationModal from '@/components/ProviderRegistrationModal';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';
import heroTruck from '@/assets/hero-truck.png';
import { MapPin, Phone, ArrowRight, CheckCircle, Settings, X, Truck } from 'lucide-react';
import { toast } from 'sonner';

const Index: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const { location, mapboxToken, setMapboxToken } = useLocation();

  const handleSaveToken = () => {
    if (tokenInput.trim()) {
      setMapboxToken(tokenInput.trim());
      toast.success('Token Mapbox salvo com sucesso!');
      setShowSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="font-display text-xl md:text-2xl font-bold text-foreground">
              ACHEI<span className="text-secondary"> GUINCHO</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Como Funciona
              </a>
              <button 
                onClick={() => setIsProviderModalOpen(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Truck className="w-4 h-4" />
                Sou Prestador
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </nav>
            <Button 
              variant="hero" 
              size="default"
              onClick={() => setIsModalOpen(true)}
            >
              Solicitar Guincho
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">Configurações</h3>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mapbox Access Token</label>
                <Input
                  placeholder="pk.eyJ1IjoiLi4uIiwiYSI6Ii4uLiJ9..."
                  value={tokenInput || mapboxToken}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Obtenha seu token em{' '}
                  <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">
                    mapbox.com
                  </a>
                </p>
              </div>
              <Button variant="hero" className="w-full" onClick={handleSaveToken}>
                Salvar Token
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen pt-20 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${heroTruck})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        </div>

        {/* Optional Map Overlay */}
        {mapboxToken && (
          <div className="absolute inset-0 z-0 opacity-20">
            <Map className="w-full h-full" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 pt-12 md:pt-24">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 backdrop-blur-sm rounded-full mb-6 animate-fade-in">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary-foreground">Atendimento 24h em todo o Brasil</span>
            </div>
            
            {/* Title */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-slide-up">
              Seu Guincho de
              <span className="text-secondary block">Bolso</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Conectamos você ao guincheiro mais próximo em poucos minutos. Sem complicação, com total transparência.
            </p>

            {/* Location Card */}
            {!location.loading && !location.error && (
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-primary-foreground/10 backdrop-blur-md rounded-xl border border-primary-foreground/20 mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-primary-foreground/70">Sua localização</p>
                  <p className="text-sm font-medium text-primary-foreground">{location.region}</p>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center animate-slide-up" style={{ animationDelay: '300ms' }}>
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto"
              >
                Solicitar Guincho Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="heroOutline" 
                size="xl"
                className="w-full sm:w-auto"
                onClick={() => window.open('https://wa.me/5562991429264', '_blank')}
              >
                <Phone className="w-5 h-5 mr-2" />
                Falar no WhatsApp
              </Button>
            </div>

            {/* Provider CTA */}
            <button
              onClick={() => setIsProviderModalOpen(true)}
              className="mt-6 text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors flex items-center gap-2 animate-fade-in"
              style={{ animationDelay: '400ms' }}
            >
              <Truck className="w-4 h-4" />
              É guincheiro? Cadastre-se aqui
            </button>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 justify-center mt-8 animate-fade-in" style={{ animationDelay: '500ms' }}>
              {['Resposta rápida', 'Preço justo', 'Profissionais verificados'].map((badge) => (
                <div key={badge} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-primary-foreground/80">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <div className="w-8 h-12 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted" id="como-funciona">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
              Simples e Rápido
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como Funciona
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Em apenas 3 passos você solicita um guincho e recebe atendimento
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Informe sua localização', desc: 'Capturamos automaticamente sua localização para agilizar o atendimento' },
              { step: '02', title: 'Escolha o serviço', desc: 'Selecione o tipo de veículo e a situação em que ele se encontra' },
              { step: '03', title: 'Receba atendimento', desc: 'O guincheiro mais próximo entra em contato pelo WhatsApp' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary text-secondary-foreground font-display font-bold text-2xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <FeaturesSection />

      {/* CTA Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroTruck})` }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Precisa de um guincho agora?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Não fique na mão! Solicite um guincho em poucos segundos e tenha atendimento rápido e seguro.
          </p>
          <Button 
            variant="hero" 
            size="xl"
            onClick={() => setIsModalOpen(true)}
          >
            Solicitar Guincho
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Request Modal */}
      <RequestModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      
      {/* Provider Registration Modal */}
      <ProviderRegistrationModal open={isProviderModalOpen} onOpenChange={setIsProviderModalOpen} />
    </div>
  );
};

export default Index;
