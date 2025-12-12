import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/contexts/LocationContext';
import LiveTrackingMap from '@/components/LiveTrackingMap';
import ProviderRegistrationModal from '@/components/ProviderRegistrationModal';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';
import RequestPanel from '@/components/RequestPanel';
import { MapPin, Phone, ArrowRight, CheckCircle, Truck, Navigation, Settings, MessageCircle } from 'lucide-react';
const Index: React.FC = () => {
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const {
    location,
    mapboxToken
  } = useLocation();
  return <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/90 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="font-display text-xl md:text-2xl font-bold text-white rounded-lg">
              Aki Guincho <span className="text-secondary">24HS</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#recursos" className="text-sm text-white/70 hover:text-white transition-colors">
                Recursos
              </a>
              <a href="#como-funciona" className="text-sm text-white/70 hover:text-white transition-colors">
                Como Funciona
              </a>
              <button onClick={() => setIsProviderModalOpen(true)} className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Sou Prestador
              </button>
            </nav>
            <Button variant="hero" size="default" onClick={() => setIsProviderModalOpen(true)} className="pb-[6px] mx-[8px] my-0 pt-[10px] pr-[7px] rounded text-base pl-[5px]">
              <Truck className="w-4 h-4 mr-2" />
              Sou Prestador
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Map with Bottom Card */}
      <section className="relative min-h-screen pt-20 overflow-hidden">
        {/* Full Map Background - Interactive */}
        <div className="absolute inset-0 z-0">
          {mapboxToken ? <LiveTrackingMap className="w-full h-full" /> : <div className="w-full h-full bg-[#0a0f1a]" />}
        </div>

        {/* Bottom Card Only - RequestPanel */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6">
          <div className="container mx-auto">
            <div className="w-full max-w-[95vw] md:max-w-[950px] lg:max-w-[1100px] mx-auto animate-slide-up">
              {/* Outer glow effect */}
              <div className="relative">
                {/* Multi-layer glow */}
                <div className="absolute -inset-3 md:-inset-5 bg-gradient-to-r from-blue-600/50 via-purple-500/40 to-blue-600/50 rounded-[1.5rem] md:rounded-[2.5rem] blur-2xl opacity-70" />
                <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-b from-blue-500/30 via-transparent to-purple-600/30 rounded-[1.25rem] md:rounded-[2rem] blur-xl" />
                
                {/* Device frame */}
                <div className="relative backdrop-blur-md md:rounded-[2rem] p-3 md:p-4 shadow-2xl border-0 border-primary-foreground rounded-3xl bg-secondary">
                  {/* Inner border glow */}
                  <div className="absolute inset-0 rounded-[1.25rem] md:rounded-[2rem] bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none" />
                  
                  {/* Content */}
                  <div className="relative overflow-hidden rounded-xl md:rounded-2xl">
                    <RequestPanel />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Provider Registration Link - Floating */}
        <div className="absolute top-24 left-0 right-0 z-10 text-center">
          <button 
            onClick={() => setIsProviderModalOpen(true)} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0a0f1a]/80 backdrop-blur-sm border border-white/20 text-white/90 text-sm hover:bg-[#0a0f1a]/90 transition-colors"
          >
            <Truck className="w-4 h-4" />
            É guincheiro? Cadastre-se aqui
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden" id="como-funciona">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-yellow-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-blue-300 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-white/20 text-white rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
              Simples e Rápido
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Em apenas 3 passos você solicita um guincho e recebe atendimento
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[{
            title: 'Informe sua localização',
            desc: 'Capturamos automaticamente sua localização para agilizar o atendimento',
            icon: Navigation,
            color: 'from-blue-400 to-cyan-400'
          }, {
            title: 'Escolha o serviço',
            desc: 'Selecione o tipo de veículo e a situação em que ele se encontra',
            icon: Settings,
            color: 'from-amber-400 to-orange-400'
          }, {
            title: 'Receba atendimento',
            desc: 'O guincheiro mais próximo entra em contato pelo WhatsApp',
            icon: MessageCircle,
            color: 'from-green-400 to-emerald-400'
          }].map((item, index) => {
            const Icon = item.icon;
            return <div key={index} className="text-center group">
                  <div className="relative mx-auto mb-6 w-24 h-24">
                    {/* Glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-3xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity`} />
                    {/* Icon container */}
                    <div className={`relative w-full h-full rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform`}>
                      <Icon className="w-10 h-10 text-white" strokeWidth={2} />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-xl text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>;
          })}
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
          <Button variant="hero" size="xl" onClick={() => window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })}>
            Solicitar Guincho
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      
      {/* Provider Registration Modal */}
      <ProviderRegistrationModal open={isProviderModalOpen} onOpenChange={setIsProviderModalOpen} />
    </div>;
};
export default Index;