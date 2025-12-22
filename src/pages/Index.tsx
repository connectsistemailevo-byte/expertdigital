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
        <div className="container mx-auto px-2 md:px-4">
          <div className="flex items-center justify-between h-14 md:h-20 gap-1">
            {/* Logo - compacto no mobile */}
            <div className="font-display text-sm md:text-2xl font-bold text-white rounded-lg flex-shrink-0 whitespace-nowrap"> Direto com o guincho. 24HS<span className="text-secondary">24HS</span>
            </div>
            
            {/* Mobile: Links em coluna */}
            <div className="flex md:hidden flex-col items-center flex-1 min-w-0 px-1">
              <a href="https://wa.me/5562994389675?text=Olá! Sou prestador e quero contratar o site Aki Guincho 24HS" target="_blank" rel="noopener noreferrer" className="text-[9px] text-secondary hover:text-secondary/80 transition-colors flex items-center gap-0.5 font-medium">
                <MessageCircle className="w-3 h-3 flex-shrink-0" />
                <span>Quero Contratar</span>
              </a>
              <a href="tel:+5562994389675" className="text-[9px] text-white/70 hover:text-white transition-colors">
                (62) 99438-9675
              </a>
            </div>
            
            {/* Desktop Nav */}
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
              <a href="https://wa.me/5562994389675?text=Olá! Sou prestador e quero contratar o site Aki Guincho 24HS" target="_blank" rel="noopener noreferrer" className="text-sm text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1.5 font-medium">Central Digital (62) 99438-9675<MessageCircle className="w-4 h-4" />
                Quero Contratar o Site (62) 99438-9675
              </a>
            </nav>
            
            {/* Botão Sou Prestador */}
            <Button variant="hero" size="sm" onClick={() => setIsProviderModalOpen(true)} className="flex-shrink-0 text-[10px] md:text-sm px-2 md:px-4 py-1 md:py-2 h-auto">
              <Truck className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              <span className="hidden sm:inline">Área do  Prestador</span>
              <span className="sm:hidden">Prestador</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Map Background with Centered Content */}
      <section className="relative min-h-screen pt-20 overflow-hidden">
        {/* Full Map Background */}
        <div className="absolute inset-0 z-0">
          {mapboxToken ? <LiveTrackingMap className="w-full h-full" showStateFilter={true} /> : <div className="w-full h-full bg-[#0a0f1a]" />}
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/70 via-[#0a0f1a]/40 to-[#0a0f1a]/80" />
        </div>

        {/* Centered Content */}
        <div className="relative z-10 container mx-auto px-4 py-6 md:py-12 flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]">
          
          {/* Card Único Unificado */}
          <div className="w-full max-w-[95vw] md:max-w-[950px] lg:max-w-[1100px] mx-auto animate-fade-in">
            <div className="relative">
              {/* Multi-layer glow */}
              <div className="absolute -inset-3 md:-inset-5 bg-gradient-to-r from-blue-600/50 via-purple-500/40 to-blue-600/50 rounded-[1.5rem] md:rounded-[2.5rem] blur-2xl opacity-70" />
              <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-b from-blue-500/30 via-transparent to-purple-600/30 rounded-[1.25rem] md:rounded-[2rem] blur-xl" />
              
              {/* Card Principal */}
              <div className="relative backdrop-blur-xl rounded-2xl md:rounded-[2rem] p-4 md:p-6 border shadow-2xl bg-secondary-foreground border-secondary border-solid">
                
                {/* Badge - no topo */}
                <div className="text-center mb-3">
                  <span className="inline-block py-2 px-4 rounded-full text-xs md:text-sm font-semibold bg-primary-foreground text-secondary-foreground">Atendimento direto com o guincho 24hs</span>
                </div>

                {/* Location Display - acima do mapa */}
                <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl mb-3 bg-green-600 text-primary-foreground border border-primary-foreground shadow-md">
                  <MapPin className="w-4 h-4 text-secondary flex-shrink-0" />
                  <span className="font-medium text-white text-sm truncate">
                    {location.loading ? 'Buscando sua localização...' : location.address || location.region || 'Localização não disponível'}
                  </span>
                </div>

                {/* Trust badges - acima do mapa */}
                <div className="flex flex-wrap justify-center items-center gap-3 mb-3">
                  {['Resposta rápida', 'Preço justo', 'Profissionais verificados'].map(badge => <div key={badge} className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-xs text-primary-foreground">{badge}</span>
                    </div>)}
                </div>
                
                {/* Map Container Inside Card */}
                <div className="relative w-full h-[200px] md:h-[280px] rounded-xl overflow-hidden mb-4">
                  {mapboxToken ? <LiveTrackingMap className="w-full h-full" /> : <div className="w-full h-full bg-[#1a1f2e] flex items-center justify-center">
                      <span className="text-white/50 text-sm">Carregando mapa...</span>
                    </div>}
                </div>

                {/* CTA for providers */}
                

                {/* RequestPanel integrado */}
                <div className="relative overflow-hidden rounded-xl md:rounded-2xl">
                  <RequestPanel />
                </div>
              </div>
            </div>
          </div>
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