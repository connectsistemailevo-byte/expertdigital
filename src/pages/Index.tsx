import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/contexts/LocationContext';
import Map from '@/components/Map';
import RequestModal from '@/components/RequestModal';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';
import heroTruck from '@/assets/hero-truck.png';
import { MapPin, Phone, ArrowRight, CheckCircle } from 'lucide-react';

const Index: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { location } = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
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

      {/* Hero Section */}
      <section className="relative min-h-screen pt-20 overflow-hidden">
        {/* Background Map */}
        <div className="absolute inset-0 z-0">
          <Map className="w-full h-full opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 pt-12 md:pt-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]">
            {/* Left Content */}
            <div className="text-center lg:text-left animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full mb-6">
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                <span className="text-sm font-medium text-secondary">Atendimento 24h em toda SP</span>
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Seu Guincho de
                <span className="text-gradient block">Bolso</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                Conectamos você ao guincheiro mais próximo em poucos minutos. Sem complicação, com transparência.
              </p>

              {/* Location Card */}
              {!location.loading && !location.error && (
                <div className="inline-flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border shadow-sm mb-8">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Sua localização</p>
                    <p className="text-sm font-medium text-foreground">{location.region}</p>
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
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
                  className="w-full sm:w-auto bg-primary text-primary-foreground border-primary-foreground/20 hover:bg-primary/90"
                  onClick={() => window.open('https://wa.me/5562991429264', '_blank')}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Falar no WhatsApp
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start mt-10">
                {['Resposta rápida', 'Preço justo', 'Profissionais verificados'].map((badge) => (
                  <div key={badge} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-secondary" />
                    <span className="text-sm text-muted-foreground">{badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Image */}
            <div className="hidden lg:flex justify-center items-center animate-float">
              <img 
                src={heroTruck} 
                alt="Guincho Achei Guincho" 
                className="max-w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full animate-pulse" />
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
      <section className="py-20 bg-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Map className="w-full h-full" />
        </div>
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
    </div>
  );
};

export default Index;
