import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/contexts/LocationContext';
import Map from '@/components/Map';
import ProviderRegistrationModal from '@/components/ProviderRegistrationModal';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';
import RequestPanel from '@/components/RequestPanel';
import { MapPin, Phone, ArrowRight, CheckCircle, Truck } from 'lucide-react';

const Index: React.FC = () => {
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const { location, mapboxToken } = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/90 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="font-display text-xl md:text-2xl font-bold text-white">
              GUINCHO FÁCIL<span className="text-secondary"> 24HS</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-sm text-white/70 hover:text-white transition-colors">
                Recursos
              </a>
              <a href="#como-funciona" className="text-sm text-white/70 hover:text-white transition-colors">
                Como Funciona
              </a>
              <button 
                onClick={() => setIsProviderModalOpen(true)}
                className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2"
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

      {/* Hero Section - Map Background with Centered Content */}
      <section className="relative min-h-screen pt-20 overflow-hidden">
        {/* Full Map Background */}
        <div className="absolute inset-0 z-0">
          {mapboxToken ? (
            <Map className="w-full h-full" />
          ) : (
            <div className="w-full h-full bg-[#0a0f1a]" />
          )}
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/80 via-[#0a0f1a]/40 to-[#0a0f1a]/80" />
        </div>

        {/* Centered Content */}
        <div className="relative z-10 container mx-auto px-4 pt-12 pb-12 flex flex-col items-center min-h-[calc(100vh-5rem)]">
          {/* Top Section - Title and Subtitle */}
          <div className="text-center mb-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-white">Atendimento 24h em todo o Brasil</span>
            </div>
            
            {/* Title */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Seu Guincho de
              <span className="text-secondary block">Bolso</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-6">
              Conectamos você ao guincheiro mais próximo em poucos minutos. Sem complicação, com total transparência.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button 
                variant="default" 
                size="lg"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                onClick={() => window.open('https://wa.me/5562991429264', '_blank')}
              >
                <Phone className="w-5 h-5 mr-2" />
                Falar no WhatsApp
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => setIsProviderModalOpen(true)}
              >
                <Truck className="w-5 h-5 mr-2" />
                Sou Prestador
              </Button>
            </div>
          </div>

          {/* Centered Modal Card */}
          <div className="w-full max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="relative">
              {/* Glow effect behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/30 rounded-3xl blur-xl opacity-50" />
              
              {/* Card */}
              <div className="relative">
                <RequestPanel />
              </div>
            </div>
          </div>

          {/* Trust badges below card */}
          <div className="flex flex-wrap justify-center items-center gap-6 mt-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
            {['Resposta rápida', 'Preço justo', 'Profissionais verificados'].map((badge) => (
              <div key={badge} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-secondary" />
                <span className="text-sm text-white/80">{badge}</span>
              </div>
            ))}
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
        <div className="absolute inset-0 bg-[#0a0f1a]" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">
            Precisa de um guincho agora?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
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
