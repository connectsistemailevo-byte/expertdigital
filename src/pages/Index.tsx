import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/contexts/LocationContext';
import Map from '@/components/Map';
import ProviderRegistrationModal from '@/components/ProviderRegistrationModal';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';
import RequestPanel from '@/components/RequestPanel';
import heroTruck from '@/assets/hero-truck.png';
import { MapPin, Phone, ArrowRight, CheckCircle, Truck } from 'lucide-react';

const Index: React.FC = () => {
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const { location, mapboxToken } = useLocation();

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
            </nav>
            <Button 
              variant="hero" 
              size="default"
              onClick={() => setIsProviderModalOpen(true)}
            >
              <Truck className="w-4 h-4 mr-2" />
              Sou Prestador
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Request Panel */}
      <section className="relative min-h-screen pt-20 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${heroTruck})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(217,71%,20%)]/98 via-[hsl(217,71%,25%)]/95 to-[hsl(217,71%,30%)]/90" />
        </div>

        {/* Optional Map Overlay */}
        {mapboxToken && (
          <div className="absolute inset-0 z-0 opacity-15 mix-blend-overlay">
            <Map className="w-full h-full" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 pt-8 pb-12">
          <div className="grid lg:grid-cols-2 gap-8 items-start min-h-[calc(100vh-8rem)]">
            {/* Left side - Hero content */}
            <div className="flex flex-col justify-center py-8 lg:py-16">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 backdrop-blur-sm rounded-full mb-6 animate-fade-in w-fit">
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="text-sm font-medium text-primary-foreground">Atendimento 24h em todo o Brasil</span>
              </div>
              
              {/* Title */}
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-slide-up drop-shadow-lg">
                Seu Guincho de
                <span className="text-secondary block">Bolso</span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-xl mb-8 animate-slide-up font-medium drop-shadow-md" style={{ animationDelay: '100ms' }}>
                Conectamos você ao guincheiro mais próximo em poucos minutos. Sem complicação, com total transparência.
              </p>

              {/* Location Card */}
              {!location.loading && !location.error && (
                <div className="inline-flex items-center gap-3 px-5 py-3 bg-primary-foreground/10 backdrop-blur-md rounded-xl border border-primary-foreground/20 mb-8 animate-fade-in w-fit" style={{ animationDelay: '200ms' }}>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-primary-foreground/70">Sua localização</p>
                    <p className="text-sm font-medium text-primary-foreground">{location.region}</p>
                  </div>
                </div>
              )}

              {/* WhatsApp Button */}
              <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
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
              <div className="flex flex-wrap items-center gap-6 mt-8 animate-fade-in" style={{ animationDelay: '500ms' }}>
                {['Resposta rápida', 'Preço justo', 'Profissionais verificados'].map((badge) => (
                  <div key={badge} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-secondary" />
                    <span className="text-sm text-primary-foreground/80">{badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Request Panel */}
            <div className="animate-slide-up lg:py-8" style={{ animationDelay: '200ms' }}>
              <RequestPanel />
            </div>
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
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Solicitar Guincho
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      
      {/* Provider Registration Modal */}
      <ProviderRegistrationModal open={isProviderModalOpen} onOpenChange={setIsProviderModalOpen} />
    </div>
  );
};

export default Index;
